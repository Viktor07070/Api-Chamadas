export function rotaNaoEncontrada(req, res) {
    res.status(404).json({
        erro: 'Rota não encontrada'
    });
}

export function tratamentoErros(err, req, res, next) {
    console.error(err);

    res.status(500).json({
        erro: 'Erro interno do servidor'
    });
}