Steps
1.- Create cdk project cdk init --language=typescript
2.- Create insfrastruture folders
3.- Move cdk code into infrastructure folder
4.- Create new nextjs app npx create-next-app@latest and use app as project name.
5.- Configure next js for static site generation.
6.- Create package json at root level for better development experience, optional you can settup husky here.
7.- Start adding CDK code.

Testing locally.
8.- Run you next js app.
9.- Synt cdk code (npm run synth:local).
10.- Then you can run cdk deploy, but let's try with github actions.
