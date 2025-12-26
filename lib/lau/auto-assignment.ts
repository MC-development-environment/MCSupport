/**
 * Asistente Virtual LAU - Auto Asignación
 * Asignación automática inteligente de tickets
 * - Quejas → SERVICE_OFFICER
 * - Departamento → TEAM_LEAD > TECHNICAL_LEAD > TECHNICIAN
 * - Skill matching para priorizar experticia
 * - Sin match → SERVICE_OFFICER (fallback)
 */

import { prisma } from "@/lib/prisma";
import { logger } from "@/lib/logger";
import type { UserRole } from "@prisma/client";
import type { TicketCategory, Language, AssignmentResult } from "./types";
import { CATEGORY_DEPARTMENT_MAP, ASSISTANT_EMAIL } from "./constants";
import {
  ASSIGNMENT_MESSAGES,
  formatMessage,
  getCategoryLabel,
  getDepartmentLabel,
} from "./messages";

/**
 * Encuentra el departamento apropiado para una categoría
 * NOTA: Retorna null si debe ir a SERVICE_OFFICER
 */
export function getDepartmentForCategory(
  category: TicketCategory
): string | null {
  return CATEGORY_DEPARTMENT_MAP[category] ?? null;
}

/**
 * Encuentra el SERVICE_OFFICER disponible (excluyendo al asistente virtual)
 */
export async function findServiceOfficer(): Promise<{
  id: string;
  name: string;
  email: string;
  role: string;
} | null> {
  try {
    const officer = await prisma.user.findFirst({
      where: {
        role: "SERVICE_OFFICER",
        email: { not: ASSISTANT_EMAIL }, // Excluir al asistente virtual
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        _count: {
          select: {
            assignedCases: {
              where: {
                status: { in: ["OPEN", "IN_PROGRESS"] },
              },
            },
          },
        },
      },
      orderBy: {
        assignedCases: {
          _count: "asc", // Menor carga primero
        },
      },
    });

    if (officer) {
      return {
        id: officer.id,
        name: officer.name || officer.email,
        email: officer.email,
        role: officer.role,
      };
    }

    return null;
  } catch (error) {
    logger.error("[LAU] Error finding SERVICE_OFFICER", { error });
    return null;
  }
}

/**
 * Extrae keywords significativas del ticket para matching de skills
 */
function extractSkillKeywords(title: string, description: string): string[] {
  const text = `${title} ${description}`.toLowerCase();
  // Palabras clave técnicas relevantes para matching
  const keywords = text
    .replace(/[^\w\sáéíóúñü]/g, " ")
    .split(/\s+/)
    .filter((w) => w.length >= 4)
    .filter(
      (w) =>
        ![
          "error",
          "problema",
          "sistema",
          "ayuda",
          "favor",
          "gracias",
          "ticket",
          "soporte",
        ].includes(w)
    );

  return [...new Set(keywords)]; // Unique
}

/**
 * Tipos de resultado de asignación con skill match
 */
interface AgentMatch {
  id: string;
  name: string;
  email: string;
  departmentName: string;
  role: string;
  skillScore: number; // 0-100 basado en skills coincidentes
  workload: number; // Conteo de tickets activos
}

/**
 * Encuentra un agente disponible para asignación con matching de skills
 * JERARQUÍA: TEAM_LEAD > TECHNICAL_LEAD > TECHNICIAN > SERVICE_OFFICER
 * PRIORIDAD: Skill match > Role hierarchy > Workload
 */
export async function findAvailableAgent(
  departmentName: string,
  ticketTitle: string = "",
  ticketDescription: string = ""
): Promise<{
  id: string;
  name: string;
  email: string;
  departmentName: string;
  role: string;
} | null> {
  try {
    // Buscar departamento
    const department = await prisma.department.findFirst({
      where: {
        name: {
          contains: departmentName,
          mode: "insensitive",
        },
      },
    });

    if (!department) {
      logger.warn(`[LAU] Department not found: ${departmentName}`);
      return null;
    }

    // Extraer keywords del ticket para matching
    const ticketKeywords = extractSkillKeywords(ticketTitle, ticketDescription);
    logger.info(
      `[LAU] Skill keywords extracted: ${ticketKeywords.slice(0, 5).join(", ")}`
    );

    // Jerarquía de roles en orden de preferencia
    const roleHierarchy: UserRole[] = [
      "TEAM_LEAD",
      "TECHNICAL_LEAD",
      "TECHNICIAN",
    ];

    // Buscar todos los agentes del departamento con sus skills y carga de trabajo
    // Nota: Después de ejecutar `npx prisma generate`, el tipo skills será reconocido
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const agents: any[] = await prisma.user.findMany({
      where: {
        departmentId: department.id,
        role: { in: roleHierarchy },
        email: { not: ASSISTANT_EMAIL },
      },
      include: {
        skills: {
          include: { skill: true },
        },
        _count: {
          select: {
            assignedCases: {
              where: {
                status: { in: ["OPEN", "IN_PROGRESS"] },
              },
            },
          },
        },
      },
    });

    if (agents.length === 0) {
      logger.warn(`[LAU] No agents found in department: ${departmentName}`);
      return null;
    }

    // Puntuar cada agente basado en skills y jerarquía
    const scoredAgents: AgentMatch[] = agents.map((agent) => {
      // Calcular puntuación de coincidencia de skills
      let skillScore = 0;
      if (ticketKeywords.length > 0 && agent.skills.length > 0) {
        // Extraer nombres de skills desde la relación en tabla de unión
        const agentSkills = agent.skills.map(
          (us: { skill: { name: string } }) => us.skill.name.toLowerCase()
        );
        const matchingSkills = ticketKeywords.filter((kw: string) =>
          agentSkills.some(
            (skill: string) => skill.includes(kw) || kw.includes(skill)
          )
        );
        skillScore = Math.min(
          100,
          Math.round((matchingSkills.length / ticketKeywords.length) * 100) +
            matchingSkills.length * 10
        );
      }

      return {
        id: agent.id,
        name: agent.name || agent.email,
        email: agent.email,
        departmentName: department.name,
        role: agent.role,
        skillScore,
        workload: agent._count.assignedCases,
      };
    });

    // Ordenar por: 1) Score de skills DESC, 2) Jerárquía de rol, 3) Carga de trabajo ASC
    scoredAgents.sort((a, b) => {
      // Si el score de skill difiere significativamente (>20%), priorizar por skill
      if (Math.abs(a.skillScore - b.skillScore) > 20) {
        return b.skillScore - a.skillScore;
      }

      // De lo contrario, ordenar por jerarquía de rol
      const aRoleIndex = roleHierarchy.indexOf(a.role as UserRole);
      const bRoleIndex = roleHierarchy.indexOf(b.role as UserRole);
      if (aRoleIndex !== bRoleIndex) {
        return aRoleIndex - bRoleIndex; // Índice menor = mayor prioridad
      }

      // Mismo rol, ordenar por carga de trabajo
      return a.workload - b.workload;
    });

    const bestMatch = scoredAgents[0];

    logger.info(
      `[LAU] Smart assignment: Selected ${bestMatch.name} (${bestMatch.role}) ` +
        `skill_score=${bestMatch.skillScore}, workload=${bestMatch.workload} tickets`
    );

    // Loguear candidatos secundarios para transparencia
    if (scoredAgents.length > 1) {
      logger.info(
        `[LAU] Other candidates: ${scoredAgents
          .slice(1, 3)
          .map((a) => `${a.name}(score=${a.skillScore},load=${a.workload})`)
          .join(", ")}`
      );
    }

    return {
      id: bestMatch.id,
      name: bestMatch.name,
      email: bestMatch.email,
      departmentName: bestMatch.departmentName,
      role: bestMatch.role,
    };
  } catch (error) {
    logger.error("[LAU] Error finding available agent", { error });
    return null;
  }
}

/**
 * Asigna automáticamente un ticket a un agente
 * LÓGICA:
 * 1. SERVICE_COMPLAINT o sin departamento → SERVICE_OFFICER
 * 2. Con departamento → TEAM_LEAD > TECHNICAL_LEAD > TECHNICIAN (con skill matching)
 * 3. Sin agentes → SERVICE_OFFICER (fallback)
 */
export async function autoAssignTicket(
  ticketId: string,
  category: TicketCategory,
  language: Language,
  ticketTitle: string = "",
  ticketDescription: string = ""
): Promise<AssignmentResult> {
  try {
    const departmentName = getDepartmentForCategory(category);

    // 1. Si no hay departamento (SERVICE_COMPLAINT, OTHER) → SERVICE_OFFICER
    if (!departmentName) {
      logger.info(`[LAU] Category ${category} maps to SERVICE_OFFICER`);
      const officer = await findServiceOfficer();

      if (officer) {
        await assignToAgent(ticketId, officer.id, officer.email, category);
        return {
          success: true,
          assignedToId: officer.id,
          assignedToName: officer.name,
          // Solo mostrar departamento, no el nombre del agente
          reason: formatMessage(
            ASSIGNMENT_MESSAGES.assignedToDepartment[language],
            {
              department:
                language === "es" ? "Servicio al Cliente" : "Customer Service",
            }
          ),
        };
      }

      return {
        success: false,
        reason:
          language === "es"
            ? "No hay oficiales de servicio disponibles"
            : "No service officers available",
      };
    }

    // 2. Buscar agente del departamento (con skill matching)
    const agent = await findAvailableAgent(
      departmentName,
      ticketTitle,
      ticketDescription
    );

    if (agent) {
      await assignToAgent(ticketId, agent.id, agent.email, category);

      // Traducir nombre de departamento según idioma del usuario
      const translatedDepartment = getDepartmentLabel(
        agent.departmentName,
        language
      );

      return {
        success: true,
        assignedToId: agent.id,
        assignedToName: agent.name,
        // Solo mostrar departamento - el nombre del técnico aparece cuando Team Lead reasigna
        reason: formatMessage(
          ASSIGNMENT_MESSAGES.assignedToDepartment[language],
          {
            department: translatedDepartment,
          }
        ),
      };
    }

    // 3. Fallback: Sin agentes en departamento → SERVICE_OFFICER
    logger.info(
      `[LAU] No agents in ${departmentName}, falling back to SERVICE_OFFICER`
    );
    const fallbackOfficer = await findServiceOfficer();

    if (fallbackOfficer) {
      await assignToAgent(
        ticketId,
        fallbackOfficer.id,
        fallbackOfficer.email,
        category
      );
      return {
        success: true,
        assignedToId: fallbackOfficer.id,
        assignedToName: fallbackOfficer.name,
        // Solo mostrar departamento
        reason: formatMessage(
          ASSIGNMENT_MESSAGES.assignedToDepartment[language],
          {
            department:
              language === "es" ? "Servicio al Cliente" : "Customer Service",
          }
        ),
      };
    }

    return {
      success: false,
      reason:
        language === "es"
          ? "No hay agentes disponibles en este momento"
          : "No agents available at this time",
    };
  } catch (error) {
    logger.error("[LAU] Error in auto-assignment", { error, ticketId });
    return {
      success: false,
      reason:
        language === "es"
          ? "Error al asignar el ticket"
          : "Error assigning ticket",
    };
  }
}

/**
 * Helper: Asigna ticket a un agente y registra auditoría
 */
async function assignToAgent(
  ticketId: string,
  agentId: string,
  agentEmail: string,
  category: TicketCategory
) {
  await prisma.case.update({
    where: { id: ticketId },
    data: { assignedToId: agentId },
  });

  const { logActivity, AuditAction, AuditEntity } = await import(
    "@/lib/audit-service"
  );
  await logActivity(AuditAction.ASSIGN, AuditEntity.TICKET, ticketId, {
    assignedTo: agentEmail,
    method: "auto-assignment",
    category: category,
  });
}

/**
 * Genera mensaje de asignación para incluir en la respuesta
 * Evita redundancia cuando categoría y departamento son similares
 */
export function generateAssignmentMessage(
  result: AssignmentResult,
  category: TicketCategory,
  language: Language
): string {
  const categoryLabel = getCategoryLabel(category, language);

  // Si la asignación fue exitosa
  if (result.success && result.assignedToName) {
    // Extraer el departamento del reason (que tiene formato "...equipo de **X**.")
    const deptMatch = result.reason.match(/\*\*([^*]+)\*\*/);
    const department = deptMatch ? deptMatch[1] : "";

    if (department) {
      // Detectar si categoría y departamento son similares para evitar redundancia
      // Ej: "Soporte Técnico" y "Soporte" son similares
      const catLower = categoryLabel.toLowerCase();
      const deptLower = department.toLowerCase();
      const areSimilar =
        catLower.includes(deptLower) || deptLower.includes(catLower);

      if (areSimilar) {
        // Usar mensaje simplificado sin repetir la categoría
        return formatMessage(ASSIGNMENT_MESSAGES.assignedOnly[language], {
          department,
        });
      } else {
        // Usar mensaje completo con categoría y departamento
        return formatMessage(
          ASSIGNMENT_MESSAGES.categoryAndDepartment[language],
          {
            category: categoryLabel,
            department: department,
          }
        );
      }
    }
  }

  // Fallback: mostrar solo categoría si no hay departamento
  let message = formatMessage(ASSIGNMENT_MESSAGES.category[language], {
    category: categoryLabel,
  });

  if (!result.success) {
    message += ASSIGNMENT_MESSAGES.noAgentAvailable[language];
  }

  return message;
}
