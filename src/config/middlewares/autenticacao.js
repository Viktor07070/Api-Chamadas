export function verificarAutenticacao(req, res, next) {
    const token = req.headers.authorization;

    const usuarios = {
        tecnico123: {
            nome: 'Victor',
            tipo: 'tecnico'
        },
        admin123: {
            nome: 'Administrador',
            tipo: 'admin'
        }
    };

    const usuario = usuarios[token];

    if (!usuario) {
        return res.status(401).json({
            erro: 'Token inválido ou não informado'
        });
    }

    req.usuario = usuario;
    next();
}