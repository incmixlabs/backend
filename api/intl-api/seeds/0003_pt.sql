DELETE FROM
  translations
WHERE
  locale_id = 2;

insert into
  translations(locale_id, key, value, namespace)
values
  (
    2,
    "invalid_credentials",
    "Credenciais Inválidas",
    "errors"
  ),
  (2, "wrong_password", "Senha Incorreta", "errors"),
  (2, "unauthorized", "Não Autorizado", "errors"),
  (2, "server_error", "Erro no Servidor", "errors"),
  (
    2,
    "forbidden",
    "Você não tem acesso a esta operação",
    "errors"
  ),
  (
    2,
    "bad_request",
    "Solicitação Inválida",
    "errors"
  ),
  (
    2,
    "already_registered",
    "E-mail já cadastrado",
    "errors"
  ),
  (
    2,
    "invalid_code",
    "Código de verificação inválido",
    "errors"
  ),
  (
    2,
    "presigned_url",
    "Falha ao obter URL pré-assinada ({{status}}): {{text}}",
    "errors"
  ),
  (
    2,
    "upload_fail",
    "Falha ao enviar arquivo",
    "errors"
  ),
  (
    2,
    "no_pp",
    "Foto de perfil não existe",
    "errors"
  ),
  (
    2,
    "pp_delete_fail",
    "Falha ao excluir foto de perfil",
    "errors"
  ),
  (
    2,
    "pp_fetch_fail",
    "Falha ao buscar foto de perfil",
    "errors"
  ),
  (
    2,
    "org_exist",
    "Organização já existe",
    "errors"
  ),
  (
    2,
    "org_not_found",
    "Organização não encontrada",
    "errors"
  ),
  (
    2,
    "role_not_found",
    "Funções não definidas no banco de dados",
    "errors"
  ),
  (
    2,
    "org_create_fail",
    "Falha ao criar organização",
    "errors"
  ),
  (
    2,
    "org_update_fail",
    "Falha ao atualizar organização",
    "errors"
  ),
  (
    2,
    "org_delete_fail",
    "Falha ao excluir organização",
    "errors"
  ),
  (
    2,
    "member_exist",
    "Membro já existe",
    "errors"
  ),
  (
    2,
    "member_insert_fail",
    "Falha ao inserir membro",
    "errors"
  ),
  (
    2,
    "last_owner",
    "Organização deve ter pelo menos um proprietário",
    "errors"
  ),
  (
    2,
    "logout_success",
    "Desconectado com sucesso",
    "auth"
  ),
  (
    2,
    "user_deleted",
    "Usuário excluído com sucesso",
    "auth"
  ),
  (
    2,
    "pp_updated",
    "Foto de perfil atualizada com sucesso",
    "auth"
  ),
  (
    2,
    "pp_deleted",
    "Foto de perfil excluída com sucesso",
    "auth"
  ),
  (
    2,
    "email_verify_required",
    "Verificação de e-mail necessária",
    "auth"
  ),
  (
    2,
    "email_already_verified",
    "E-mail já verificado",
    "auth"
  ),
  (
    2,
    "verify_success",
    "E-mail verificado com sucesso! Redirecionando para a página de login",
    "auth"
  ),
  (
    2,
    "mail_sent",
    "E-mail enviado com sucesso",
    "auth"
  ),
  (
    2,
    "pass_reset_success",
    "Senha redefinida com sucesso",
    "auth"
  ),
  (
    2,
    "org_delete_success",
    "Organização excluída com sucesso",
    "auth"
  ),
  (
    2,
    "casl_forbidden",
    "Ação: {{action}} não é permitida para o papel: {{role}}",
    "errors"
  ),
  (
    2,
    "user_not_found",
    "Usuário não encontrado",
    "errors"
  ),
  (
    2,
    "not_member",
    "Usuário não é membro",
    "errors"
  ),
  (
    2,
    "not_implemented",
    "Não implementado",
    "errors"
  ),
  (
    2,
    "filename_req",
    "Nome do arquivo é obrigatório",
    "errors"
  ),
  (
    2,
    "file_not_found",
    "Arquivo não encontrado",
    "errors"
  ),
  (
    2,
    "files_list_failed",
    "Falha ao obter lista de arquivos",
    "errors"
  ),
  (
    2,
    "r2_missing",
    "Configuração R2 ausente",
    "errors"
  ),
  (
    2,
    "r2_bucket",
    "R2_BUCKET não está definido",
    "errors"
  ),
  (
    2,
    "delete_success",
    "Arquivo excluído com sucesso",
    "files"
  ),
  (
    2,
    "task_insert_fail",
    "Falha ao adicionar tarefa",
    "errors"
  ),
  (
    2,
    "task_update_fail",
    "Falha ao atualizar tarefa",
    "errors"
  ),
  (
    2,
    "task_delete_fail",
    "Falha ao excluir tarefa",
    "errors"
  ),
  (
    2,
    "task_not_found",
    "Tarefa não encontrada",
    "errors"
  ),
  (
    2,
    "fullName",
    "Nome Completo",
    "common"
  ),
  (
    2,
    "email",
    "Email",
    "common"
  ),
  (
    2,
    "password",
    "Senha",
    "common"
  ),
  (
    2,
    "loading",
    "Carregando...",
    "common"
  ),
  (
    2,
    "back",
    "Voltar",
    "common"
  ),
  (2, "you", "Você", "common"),
  (
    2,
    "remove",
    "Remover",
    "common"
  ),
  (
    2,
    "confirm",
    "Confirmar",
    "common"
  ),
  (
    2,
    "cancel",
    "Cancelar",
    "common"
  ),
  (
    2,
    "verificationCode",
    "Código de Verificação",
    "common"
  ),
  (
    2,
    "title",
    "Página Não Encontrada",
    "pageNotFound"
  ),
  (
    2,
    "message",
    "A página que você está procurando não existe.",
    "pageNotFound"
  ),
  (
    2,
    "backToHome",
    "Voltar para a página inicial",
    "pageNotFound"
  ),
  (
    2,
    "backToHome",
    "Voltar para a página inicial",
    "pageNotFound"
  ),
  (
    2,
    "dashboard",
    "Painel",
    "sidebar"
  ),
  (
    2,
    "inbox",
    "Caixa de entrada",
    "sidebar"
  ),
  (
    2,
    "ecommerce",
    "E-commerce",
    "sidebar"
  ),
  (
    2,
    "users",
    "Usuários",
    "sidebar"
  ),
  (
    2,
    "usersList",
    "Lista de usuários",
    "sidebar"
  ),
  (
    2,
    "profile",
    "Perfil",
    "sidebar"
  ),
  (2, "feed", "Feed", "sidebar"),
  (
    2,
    "settings",
    "Configurações",
    "sidebar"
  ),
  (
    2,
    "pages",
    "Páginas",
    "sidebar"
  ),
  (
    2,
    "organizations",
    "Organizações",
    "sidebar"
  ),
  (
    2,
    "authentication",
    "Autenticação",
    "sidebar"
  ),
  (
    2,
    "docs",
    "Documentação",
    "sidebar"
  ),
  (
    2,
    "components",
    "Componentes",
    "sidebar"
  ),
  (
    2,
    "help",
    "Ajuda",
    "sidebar"
  ),
  (
    2,
    "toggleSidebar",
    "Alternar barra lateral",
    "navbar"
  ),
  (
    2,
    "search",
    "Pesquisar",
    "navbar"
  ),
  (
    2,
    "toggleTheme",
    "Alternar tema",
    "navbar"
  ),
  (
    2,
    "notifications",
    "Notificações",
    "navbar"
  ),
  (
    2,
    "settings",
    "Configurações",
    "navbar"
  ),
  (
    2,
    "profile",
    "Perfil",
    "navbar"
  ),
  (
    2,
    "error.uploadProfilePicture",
    "Erro ao enviar foto de perfil",
    "profileImage"
  ),
  (
    2,
    "error.addProfilePicture",
    "Erro ao adicionar foto de perfil",
    "profileImage"
  ),
  (
    2,
    "error.deleteProfilePicture",
    "Erro ao deletar foto de perfil",
    "profileImage"
  ),
  (
    2,
    "success.uploadProfilePicture",
    "Foto de perfil enviada com sucesso",
    "profileImage"
  ),
  (
    2,
    "success.addProfilePicture",
    "Foto de perfil adicionada com sucesso",
    "profileImage"
  ),
  (
    2,
    "success.deleteProfilePicture",
    "Foto de perfil deletada com sucesso",
    "profileImage"
  ),
  (2, "settings", "Configurações", "settings"),
  (
    2,
    "generalInfo",
    "Informações gerais",
    "settings"
  ),
  (
    2,
    "nameRequired",
    "O nome é obrigatório",
    "settings"
  ),
  (2, "saving", "Salvando...", "settings"),
  (
    2,
    "saveChanges",
    "Salvar alterações",
    "settings"
  ),
  (2, "changePassword", "Alterar senha", "settings"),
  (2, "currentPassword", "Senha atual", "settings"),
  (
    2,
    "currentPasswordRequired",
    "A senha atual é obrigatória",
    "settings"
  ),
  (2, "newPassword", "Nova senha", "settings"),
  (
    2,
    "newPasswordLength",
    "A nova senha deve ter pelo menos 8 caracteres",
    "settings"
  ),
  (
    2,
    "confirmNewPassword",
    "Confirmar nova senha",
    "settings"
  ),
  (
    2,
    "confirmPasswordRequired",
    "Por favor, confirme sua nova senha",
    "settings"
  ),
  (2, "organizations", "Organizações", "settings"),
  (2, "organization", "Organização", "settings"),
  (
    2,
    "languageSettings",
    "Configurações de Idioma",
    "settings"
  ),
  (
    2,
    "selectLanguage",
    "Selecionar Idioma",
    "settings"
  ),
  (
    2,
    "sidebarSettings",
    "Configurações da Barra Lateral",
    "settings"
  ),
  (
    2,
    "minifySidebar",
    "Minificar Barra Lateral",
    "settings"
  ),
  (
    2,
    "themeSettings",
    "Configurações de Tema",
    "settings"
  ),
  (2, "darkMode", "Modo Escuro", "settings"),
  (
    2,
    "logout",
    "Sair",
    "profile"
  ),
  (
    2,
    "profileInformation",
    "Informações do Perfil",
    "profile"
  ),
  (
    2,
    "error.uploadProfilePicture",
    "Erro ao enviar foto de perfil",
    "profile"
  ),
  (
    2,
    "error.addProfilePicture",
    "Erro ao adicionar foto de perfil",
    "profile"
  ),
  (
    2,
    "error.updateUser",
    "Erro ao atualizar usuário",
    "profile"
  ),
  (
    2,
    "error.deleteProfilePicture",
    "Erro ao deletar foto de perfil",
    "profile"
  ),
  (
    2,
    "error.changePassword",
    "Erro ao alterar senha",
    "profile"
  ),
  (
    2,
    "success.uploadProfilePicture",
    "Foto de perfil enviada com sucesso",
    "profile"
  ),
  (
    2,
    "success.addProfilePicture",
    "Foto de perfil adicionada com sucesso",
    "profile"
  ),
  (
    2,
    "success.updateUser",
    "Usuário atualizado com sucesso",
    "profile"
  ),
  (
    2,
    "success.deleteProfilePicture",
    "Foto de perfil deletada com sucesso",
    "profile"
  ),
  (
    2,
    "success.changePassword",
    "Senha alterada com sucesso",
    "profile"
  ),
  (
    2,
    "title",
    "Entrar",
    "login"
  ),
  (
    2,
    "emailValidation",
    "Por favor, insira um email válido",
    "login"
  ),
  (
    2,
    "passwordValidation",
    "Por favor, insira sua senha",
    "login"
  ),
  (
    2,
    "submit",
    "Entrar",
    "login"
  ),
  (
    2,
    "loggingIn",
    "Iniciando sessão...",
    "login"
  ),
  (
    2,
    "googleLogin",
    "Entrar com Google",
    "login"
  ),
  (
    2,
    "signupPrompt",
    "Não tem uma conta? Cadastre-se",
    "login"
  ),
  (
    2,
    "forgotPassword",
    "Esqueceu sua senha?",
    "login"
  ),
  (
    2,
    "redirected",
    "Você será redirecionado para o app.",
    "login"
  ),
  (
    2,
    "closeWindow",
    "Você pode fechar esta janela.",
    "login"
  ),
  (
    2,
    "error.googleAuthUrl",
    "Falha ao recuperar URL de autenticação",
    "login"
  ),
  (
    2,
    "error.googleAuth",
    "Falha ao autenticar com Google",
    "login"
  ),
  (
    2,
    "error.login",
    "Erro ao efetuar login",
    "login"
  ),
  (
    2,
    "error.logout",
    "Erro ao efetuar logout",
    "login"
  ),
  (
    2,
    "success.login",
    "Login efetuado com sucesso",
    "login"
  ),
  (
    2,
    "success.logout",
    "Logout efetuado com sucesso",
    "login"
  ),
  (
    2,
    "title",
    "Cadastro",
    "signup"
  ),
  (
    2,
    "fullNameValidation",
    "Por favor, insira seu nome",
    "signup"
  ),
  (
    2,
    "emailValidation",
    "Por favor, insira um email válido",
    "signup"
  ),
  (
    2,
    "passwordValidation",
    "Por favor, insira sua senha",
    "signup"
  ),
  (
    2,
    "submit",
    "Cadastrar",
    "signup"
  ),
  (
    2,
    "signingUp",
    "Cadastrando...",
    "signup"
  ),
  (
    2,
    "signupSuccess",
    "Cadastro realizado com sucesso",
    "signup"
  ),
  (
    2,
    "loginPrompt",
    "Já tem uma conta? Faça login",
    "signup"
  ),
  (
    2,
    "error.signup",
    "Erro ao cadastrar",
    "signup"
  ),
  (
    2,
    "title",
    "Verificação de Email",
    "emailVerification"
  ),
  (
    2,
    "verifying",
    "Verificando",
    "emailVerification"
  ),
  (
    2,
    "verified",
    "Verificado",
    "emailVerification"
  ),
  (
    2,
    "title",
    "Organizações",
    "organizations"
  ),
  (
    2,
    "createOrganization",
    "Criar Organização",
    "organizations"
  ),
  (
    2,
    "name",
    "Nome",
    "organizations"
  ),
  (
    2,
    "members",
    "Membros",
    "organizations"
  ),
  (
    2,
    "loading",
    "Carregando...",
    "organizations"
  ),
  (
    2,
    "createNewOrganization",
    "Criar Nova Organização",
    "organizations"
  ),
  (
    2,
    "organizationName",
    "Nome da Organização",
    "organizations"
  ),
  (
    2,
    "create",
    "Criar",
    "organizations"
  ),
  (
    2,
    "creating",
    "Criando...",
    "organizations"
  ),
  (
    2,
    "noOrganizations",
    "Você ainda não faz parte de nenhuma organização.",
    "organizations"
  ),
  (
    2,
    "errorLoading",
    "Falha ao carregar organizações. Por favor, tente novamente.",
    "organizations"
  ),
  (
    2,
    "notFound",
    "Organização não encontrada",
    "organizationDetails"
  ),
  (
    2,
    "deleteOrganization",
    "Excluir Organização",
    "organizationDetails"
  ),
  (
    2,
    "members",
    "Membros",
    "organizationDetails"
  ),
  (
    2,
    "name",
    "Nome",
    "organizationDetails"
  ),
  (
    2,
    "email",
    "E-mail",
    "organizationDetails"
  ),
  (
    2,
    "role",
    "Função",
    "organizationDetails"
  ),
  (
    2,
    "actions",
    "Ações",
    "organizationDetails"
  ),
  (
    2,
    "newMemberEmail",
    "E-mail do Novo Membro",
    "organizationDetails"
  ),
  (
    2,
    "addMember",
    "Adicionar Membro",
    "organizationDetails"
  ),
  (
    2,
    "cannotRemoveSelf",
    "Você não pode remover a si mesmo",
    "organizationDetails"
  ),
  (
    2,
    "deleteConfirmation",
    "Tem certeza que deseja excluir {name}?",
    "organizationDetails"
  ),
  (
    2,
    "editRole",
    "Editar função",
    "organizationDetails"
  ),
  (
    2,
    "editName",
    "Editar nome",
    "organizationDetails"
  ),
  (
    2,
    "users",
    "Usuários",
    "organizationDetails"
  ),
  (
    2,
    "environmentVariables",
    "Variáveis de Ambiente",
    "organizationDetails"
  ),
  (
    2,
    "success.addMember",
    "Membro adicionado com sucesso",
    "organizationDetails"
  ),
  (
    2,
    "success.deleteOrganization",
    "Organização excluída com sucesso",
    "organizationDetails"
  ),
  (
    2,
    "success.updateOrganizationName",
    "Nome da organização atualizado com sucesso",
    "organizationDetails"
  ),
  (
    2,
    "error.addMember",
    "Erro ao adicionar membro",
    "organizationDetails"
  ),
  (
    2,
    "error.updateMemberRole",
    "Erro ao atualizar função do membro",
    "organizationDetails"
  ),
  (
    2,
    "error.deleteOrganization",
    "Erro ao excluir organização",
    "organizationDetails"
  ),
  (
    2,
    "error.updateOrganizationName",
    "Erro ao atualizar nome da organização",
    "organizationDetails"
  ),
  (
    2,
    "owner",
    "Proprietário",
    "roles"
  ),
  (
    2,
    "admin",
    "Administrador",
    "roles"
  ),
  (
    2,
    "editor",
    "Editor",
    "roles"
  ),
  (
    2,
    "commenter",
    "Comentador",
    "roles"
  ),
  (
    2,
    "viewer",
    "Visualizador",
    "roles"
  );