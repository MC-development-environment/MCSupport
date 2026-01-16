"use client";

import { useEffect, useMemo } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import {
  AlertCircle,
  Database,
  ServerCrash,
  RefreshCw,
  WifiOff,
} from "lucide-react";

// Detectar tipo de error para mejor UX
type ErrorType = "database" | "network" | "server" | "unknown";

function detectErrorType(error: Error): ErrorType {
  const message = error.message?.toLowerCase() || "";
  const name = error.name?.toLowerCase() || "";

  if (
    message.includes("database") ||
    message.includes("prisma") ||
    message.includes("5432") ||
    message.includes("connection") ||
    name.includes("prisma")
  ) {
    return "database";
  }

  if (
    message.includes("network") ||
    message.includes("fetch") ||
    message.includes("econnrefused")
  ) {
    return "network";
  }

  if (message.includes("server") || message.includes("500")) {
    return "server";
  }

  return "unknown";
}

const errorConfig = {
  database: {
    icon: Database,
    gradient: "from-amber-500/20 to-amber-500/5",
    iconColor: "text-amber-500",
    borderColor: "border-amber-200 dark:border-amber-900/50",
  },
  network: {
    icon: WifiOff,
    gradient: "from-blue-500/20 to-blue-500/5",
    iconColor: "text-blue-500",
    borderColor: "border-blue-200 dark:border-blue-900/50",
  },
  server: {
    icon: ServerCrash,
    gradient: "from-red-500/20 to-red-500/5",
    iconColor: "text-red-500",
    borderColor: "border-red-200 dark:border-red-900/50",
  },
  unknown: {
    icon: AlertCircle,
    gradient: "from-gray-500/20 to-gray-500/5",
    iconColor: "text-gray-500",
    borderColor: "border-gray-200 dark:border-gray-800",
  },
};

export default function PortalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const t = useTranslations("Error");

  useEffect(() => {
    // Log completo solo en consola
    console.error("[Portal Error]", error);
  }, [error]);

  const errorType = useMemo(() => detectErrorType(error), [error]);
  const config = errorConfig[errorType];
  const IconComponent = config.icon;

  // Mensajes amigables según tipo de error
  const getFriendlyMessage = () => {
    switch (errorType) {
      case "database":
        return t("databaseError");
      case "network":
        return t("networkError");
      case "server":
        return t("serverError");
      default:
        return t("genericError");
    }
  };

  const getFriendlyDescription = () => {
    switch (errorType) {
      case "database":
        return t("databaseErrorDesc");
      case "network":
        return t("networkErrorDesc");
      case "server":
        return t("serverErrorDesc");
      default:
        return t("genericErrorDesc");
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center p-4 bg-gray-50 dark:bg-gray-900">
      <Card
        className={`w-full max-w-md shadow-lg ${config.borderColor} overflow-hidden`}
      >
        <CardHeader className="text-center pb-2">
          <div
            className={`mx-auto bg-gradient-to-br ${config.gradient} p-5 rounded-full w-fit mb-4`}
          >
            <IconComponent className={`h-10 w-10 ${config.iconColor}`} />
          </div>
          <CardTitle className="text-xl">{getFriendlyMessage()}</CardTitle>
          <CardDescription className="mt-2">
            {getFriendlyDescription()}
          </CardDescription>
        </CardHeader>

        <CardContent className="text-center space-y-3">
          {/* Solo mostrar detalles técnicos en desarrollo */}
          {process.env.NODE_ENV === "development" && (
            <details className="text-left">
              <summary className="text-xs text-muted-foreground cursor-pointer hover:text-foreground transition-colors">
                {t("technicalDetails")}
              </summary>
              <div className="mt-2 p-3 bg-muted/50 rounded-md text-xs font-mono overflow-auto max-h-32">
                <p className="text-destructive break-all">{error.message}</p>
                {error.digest && (
                  <p className="mt-1 text-muted-foreground">
                    Digest: {error.digest}
                  </p>
                )}
              </div>
            </details>
          )}

          {/* Mostrar solo digest en producción para soporte */}
          {process.env.NODE_ENV === "production" && error.digest && (
            <p className="text-xs text-muted-foreground">
              {t("errorCode")}: {error.digest}
            </p>
          )}
        </CardContent>

        <CardFooter className="flex justify-center pt-2">
          <Button
            onClick={() => {
              // Forzar recarga completa para errores de conexión
              if (errorType === "database" || errorType === "network") {
                window.location.reload();
              } else {
                reset();
              }
            }}
            className="gap-2"
          >
            <RefreshCw className="h-4 w-4" />
            {t("retry")}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
