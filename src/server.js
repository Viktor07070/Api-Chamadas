import express from 'express';
import pool from './config/database.js';

import {
    rotaNaoEncontrada,
    tratamentoErros
} from './config/middlewares/erros.js';

import { registrarRequisicao } from './config/middlewares/registrarRequisicao.js';

import {
    validarChamado,
    validarPrioridade
} from './config/middlewares/validacao.js';

import { verificarAutenticacao } from './config/middlewares/autenticacao.js';
import { somenteAdmin } from './config/middlewares/autorizacao.js';

const app = express();

app.use(express.json());

app.use(registrarRequisicao);

app.get('/', async (req, res, next) => {
    try {
        const resultado = await pool.query('SELECT NOW()');

        res.json({
            mensagem: 'Conexão com o PostgreSQL funcionando!',
            horario: resultado.rows[0].now
        });

    } catch (erro) {
        next(erro);
    }
});

app.get('/chamados', async (req, res, next) => {
    try {
        const { status, prioridade } = req.query;

        let consulta = 'SELECT * FROM chamados';
        const valores = [];
        const condicoes = [];

        if (status) {
            valores.push(status);
            condicoes.push(`status = $${valores.length}`);
        }

        if (prioridade) {
            valores.push(prioridade);
            condicoes.push(`prioridade = $${valores.length}`);
        }

        if (condicoes.length > 0) {
            consulta += ' WHERE ' + condicoes.join(' AND ');
        }

        const resultado = await pool.query(consulta, valores);

        res.json(resultado.rows);

    } catch (erro) {
        next(erro);
    }
});

app.get('/chamados/estatisticas', async (req, res, next) => {
    try {
        const resultado = await pool.query(`
            SELECT
                COUNT(*) AS total,
                COUNT(*) FILTER (WHERE status = 'aberto') AS abertos,
                COUNT(*) FILTER (WHERE status = 'em_atendimento') AS em_atendimento,
                COUNT(*) FILTER (WHERE status = 'finalizado') AS finalizados,
                COUNT(*) FILTER (WHERE prioridade = 'alta') AS alta_prioridade
            FROM chamados
        `);

        res.json(resultado.rows[0]);

    } catch (erro) {
        next(erro);
    }
});

app.get('/chamados/:id', async (req, res, next) => {
    try {
        const { id } = req.params;

        const resultado = await pool.query(
            'SELECT * FROM chamados WHERE id = $1',
            [id]
        );

        if (resultado.rows.length === 0) {
            return res.status(404).json({
                erro: 'Chamado não encontrado'
            });
        }

        res.json(resultado.rows[0]);

    } catch (erro) {
        next(erro);
    }
});

app.post(
    '/chamados',
    validarChamado,
    validarPrioridade,
    async (req, res, next) => {
        try {
            const { titulo, descricao, setor, prioridade } = req.body;

            const resultado = await pool.query(
                `INSERT INTO chamados
                (titulo, descricao, setor, prioridade, status, responsavel, data_abertura)
                VALUES ($1, $2, $3, $4, 'aberto', '', NOW())
                RETURNING *`,
                [titulo, descricao, setor, prioridade]
            );

            res.status(201).json(resultado.rows[0]);

        } catch (erro) {
            next(erro);
        }
    }
);

app.patch(
    '/chamados/:id/assumir',
    verificarAutenticacao,
    async (req, res, next) => {
        try {
            const { id } = req.params;

            const consulta = await pool.query(
                'SELECT * FROM chamados WHERE id = $1',
                [id]
            );

            if (consulta.rows.length === 0) {
                return res.status(404).json({
                    erro: 'Chamado não encontrado'
                });
            }

            const chamado = consulta.rows[0];

            if (chamado.status !== 'aberto') {
                return res.status(400).json({
                    erro: 'Chamado não pode ser assumido'
                });
            }

            const resultado = await pool.query(
                `UPDATE chamados
                 SET status = 'em_atendimento',
                     responsavel = $1
                 WHERE id = $2
                 RETURNING *`,
                [req.usuario.nome, id]
            );

            res.json(resultado.rows[0]);

        } catch (erro) {
            next(erro);
        }
    }
);

app.patch(
    '/chamados/:id/finalizar',
    verificarAutenticacao,
    async (req, res, next) => {
        try {
            const { id } = req.params;

            const consulta = await pool.query(
                'SELECT * FROM chamados WHERE id = $1',
                [id]
            );

            if (consulta.rows.length === 0) {
                return res.status(404).json({
                    erro: 'Chamado não encontrado'
                });
            }

            const chamado = consulta.rows[0];

            if (chamado.status !== 'em_atendimento') {
                return res.status(400).json({
                    erro: 'Chamado não pode ser finalizado'
                });
            }

            const resultado = await pool.query(
                `UPDATE chamados
                 SET status = 'finalizado'
                 WHERE id = $1
                 RETURNING *`,
                [id]
            );

            res.json(resultado.rows[0]);

        } catch (erro) {
            next(erro);
        }
    }
);

app.delete(
    '/chamados/:id',
    verificarAutenticacao,
    somenteAdmin,
    async (req, res, next) => {
        try {
            const { id } = req.params;

            const resultado = await pool.query(
                'DELETE FROM chamados WHERE id = $1 RETURNING *',
                [id]
            );

            if (resultado.rows.length === 0) {
                return res.status(404).json({
                    erro: 'Chamado não encontrado'
                });
            }

            res.json(resultado.rows[0]);

        } catch (erro) {
            next(erro);
        }
    }
);

app.use(rotaNaoEncontrada);

app.use(tratamentoErros);

app.listen(3000, () => {
    console.log('Servidor rodando em http://localhost:3000');
});