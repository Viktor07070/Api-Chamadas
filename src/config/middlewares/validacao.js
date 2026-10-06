export function validarChamado(req, res, next) {
    const { titulo, descricao, setor, prioridade } = req.body;

    if (!titulo || !descricao || !setor || !prioridade) {
        return res.status(400).json({
            erro: 'titulo, descricao, setor e prioridade são obrigatórios'
        });
    }

    next();
}

export function validarPrioridade(req, res, next) {
    const prioridades = ['baixa', 'media', 'alta'];

    if (!prioridades.includes(req.body.prioridade)) {
        return res.status(400).json({
            erro: 'Prioridade inválida. Use: baixa, media ou alta'
        });
    }

    next();
}