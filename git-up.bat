
REM Configurar SSH para GitHub
git config core.sshCommand "ssh -i ~/.ssh/github-for-job"
git remote set-url origin git@github-for-job:MC-Development-Environment/MCSupport.git

REM Agregar y commitear cambios
git add .
git commit -m "Update"

REM Subir cambios a GitHub
git push origin master
