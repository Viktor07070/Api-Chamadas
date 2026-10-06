export function registrarRequisicao(req, res, next) {
    const agora = new Date();

    const data = agora.toLocaleDateString('pt-BR');
    const horario = agora.toLocaleTimeString('pt-BR');

    console.log(`[${data} ${horario}] ${req.method} ${req.originalUrl}`);

    next();
}