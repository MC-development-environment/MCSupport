
// Configurar SSH para GitHub
git config core.sshCommand "ssh -i ~/.ssh/github-for-job"
git remote set-url origin git@github-for-job:MC-Development-Environment/MCSupport.git

// Agregar y commitear cambios
git add .
git commit -m "Update"

// Subir cambios a GitHub
git push origin main
