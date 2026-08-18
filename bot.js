const express = require('express');
const axios = require('axios');
require('dotenv').config();

const app = express();
app.use(express.json());

// ==========================================
// CONFIGURACIÓN DESDE .env
// ==========================================

const {
    WHATSAPP_TOKEN,
    WHATSAPP_PHONE_ID = '1222698170925154',
    WHATSAPP_API_VERSION = 'v25.0',
    VERIFY_TOKEN = 'trinity3d_bot_2024',
    OLLAMA_URL = 'http://localhost:11434',
    OLLAMA_MODEL = 'qwen3:4b',
    PORT = 3000
} = process.env;

// ==========================================
// RESPUESTAS LOCALES DE TRINITY 3D
// ==========================================

function obtenerRespuestaLocalBackup(texto) {
    const mensaje = texto.toLowerCase().trim();
    
    if (mensaje.includes('hola') || mensaje.includes('buenas') || mensaje.includes('hey') || mensaje.includes('buenos dias') || mensaje.includes('buenas tardes')) {
        return '¡Hola! 👋 Soy Trinity, el asistente virtual de Trinity 3D.\n\n¿En qué puedo ayudarte hoy?\n\n📌 *Servicios:*\n• Impresión 3D\n• Diseño y modelado\n• Escaneo 3D\n• Prototipado\n\nResponde con el número de la opción que te interese.';
    }
    
    if (mensaje.includes('1') && (mensaje.includes('servicio') || mensaje.includes('impresion') || mensaje.includes('imprimir'))) {
        return '🖨️ *Servicio de Impresión 3D*\n\nOfrecemos:\n• Impresión FDM (PLA, ABS, PETG)\n• Impresión en resina\n• Piezas personalizadas\n• Prototipos rápidos\n\n*Para cotizar necesito:*\n📐 Dimensiones de la pieza\n🎨 Color deseado\n📁 Archivo STL/OBJ (si tienes)\n\n¿Me compartes estos datos?';
    }
    
    if (mensaje.includes('2') && (mensaje.includes('diseño') || mensaje.includes('diseño') || mensaje.includes('modelado'))) {
        return '🎨 *Diseño y Modelado 3D*\n\nServicios:\n• Modelado desde cero\n• Optimización de diseños\n• Conversión de formatos\n• Asesoría técnica\n\nCuéntame qué necesitas diseñar y te ayudo.';
    }
    
    if (mensaje.includes('servicio') || mensaje.includes('servicios')) {
        return '🔧 *Servicios de Trinity 3D*\n\n1️⃣ Impresión 3D personalizada\n2️⃣ Diseño y modelado 3D\n3️⃣ Escaneo 3D\n4️⃣ Prototipado rápido\n5️⃣ Asesoría técnica\n\n*Responde con el número* para más información.';
    }
    
    if (mensaje.includes('precio') || mensaje.includes('costo') || mensaje.includes('cotizacion') || mensaje.includes('cotización') || mensaje.includes('cuanto cuesta')) {
        return '💰 *Cotizaciones*\n\nPara darte un precio preciso necesito:\n\n📐 *Dimensiones* (cm)\n🔧 *Material* (PLA, ABS, PETG, resina)\n🎨 *Color*\n📁 *Archivo STL/OBJ* (si tienes)\n\nPuedes enviarme esta info y te cotizo al instante.';
    }
    
    if (mensaje.includes('material') || mensaje.includes('materiales')) {
        return '🔩 *Materiales disponibles*\n\n• *PLA*: Económico, fácil de imprimir\n• *ABS*: Resistente al calor\n• *PETG*: Resistente y flexible\n• *TPU*: Flexible\n• *Resina*: Alta precisión\n\n¿Cuál te interesa?';
    }
    
    if (mensaje.includes('tiempo') || mensaje.includes('entrega') || mensaje.includes('cuanto tarda') || mensaje.includes('demora')) {
        return '⏱️ *Tiempos de entrega*\n\n• Piezas simples: 24-48 horas\n• Piezas medianas: 3-5 días\n• Proyectos complejos: 5-10 días\n\n*Nota:* El tiempo exacto se confirma al cotizar.';
    }
    
    if (mensaje.includes('contacto') || mensaje.includes('telefono') || mensaje.includes('whatsapp') || mensaje.includes('ubicacion') || mensaje.includes('direccion') || mensaje.includes('donde estan')) {
        return '📞 *Contacto Trinity 3D*\n\n• *WhatsApp:* +57 311 3969580\n• *Horario:* Lunes a Viernes 9:00 - 18:00\n• *Ubicación:* Colombia\n\n¡Estamos para servirte! 😊';
    }
    
    if (mensaje.includes('ping')) {
        return 'pong ✅';
    }
    
    if (mensaje.includes('gracias')) {
        return '¡Con gusto! 😊 Si necesitas algo más, aquí estoy.';
    }
    
    if (mensaje.includes('adios') || mensaje.includes('chao') || mensaje.includes('hasta luego')) {
        return '¡Hasta pronto! 👋 Gracias por contactar a Trinity 3D.';
    }
    
    return 'No estoy seguro de entender. 🤔\n\nPuedo ayudarte con:\n• *Servicios* - Escribe "servicios"\n• *Cotizaciones* - Escribe "cotización"\n• *Materiales* - Escribe "materiales"\n• *Contacto* - Escribe "contacto"\n\n¿Qué te gustaría saber?';
}


// ==========================================
// IA LOCAL CON OLLAMA
// ==========================================

const conversaciones = new Map();

const SYSTEM_PROMPT = `
Eres Trinity, asistente virtual de Trinity 3D.

Tu trabajo es conversar de forma natural con clientes por WhatsApp.

Reglas:
- Responde siempre en español.
- Se claro, profesional y breve.
- No digas que eres un modelo de inteligencia artificial.
- No inventes precios, direcciones, tiempos de entrega ni datos que no conozcas.
- Si falta informacion para una cotizacion, pregunta lo necesario.
- Recuerda el contexto reciente de la conversacion.
- Haz una sola pregunta a la vez cuando necesites informacion.
- No muestres razonamientos internos.
- No uses respuestas excesivamente largas.
- Puedes orientar sobre impresion 3D, diseño y modelado 3D, escaneo 3D, prototipado y materiales.
`;

async function obtenerRespuestaIA(telefono, texto) {

    const usuario = telefono || 'prueba-local';

    if (!conversaciones.has(usuario)) {
        conversaciones.set(usuario, []);
    }

    const historial = conversaciones.get(usuario);

    historial.push({
        role: 'user',
        content: texto
    });

    // Conservar solamente contexto reciente
    if (historial.length > 10) {
        historial.splice(0, historial.length - 10);
    }

    try {

        console.log(`Consultando Ollama ${OLLAMA_MODEL}...`);

        const response = await axios.post(
            `${OLLAMA_URL}/api/chat`,
            {
                model: OLLAMA_MODEL,
                messages: [
                    {
                        role: 'system',
                        content: SYSTEM_PROMPT
                    },
                    ...historial
                ],
                stream: false,
                think: false,
                options: {
                    temperature: 0.6
                }
            },
            {
                timeout: 60000
            }
        );

        const respuesta =
            response.data?.message?.content?.trim();

        if (!respuesta) {
            throw new Error('Ollama no devolvio respuesta');
        }

        historial.push({
            role: 'assistant',
            content: respuesta
        });

        if (historial.length > 10) {
            historial.splice(0, historial.length - 10);
        }

        console.log(`Ollama respondio: ${respuesta}`);

        return respuesta;

    } catch (error) {

        console.error(
            'Error con Ollama:',
            error.response?.data || error.message
        );

        console.log('Usando respuesta local de respaldo');

        return obtenerRespuestaLocalBackup(texto);
    }
}

// ==========================================
// FUNCIÓN PARA ENVIAR WHATSAPP
// ==========================================

async function enviarMensajeWhatsApp(telefono, mensaje) {
    try {
        const url = `https://graph.facebook.com/${WHATSAPP_API_VERSION}/${WHATSAPP_PHONE_ID}/messages`;
        
        const response = await axios.post(
            url,
            {
                messaging_product: 'whatsapp',
                to: telefono,
                type: 'text',
                text: {
                    body: mensaje
                }
            },
            {
                headers: {
                    Authorization: `Bearer ${WHATSAPP_TOKEN}`,
                    'Content-Type': 'application/json'
                }
            }
        );
        
        console.log('✅ Mensaje enviado a:', telefono);
        return response.data;
    } catch (error) {
        console.error('❌ Error enviando WhatsApp:', error.response?.data || error.message);
        throw error;
    }
}

// ==========================================
// WEBHOOK DE WHATSAPP
// ==========================================

app.get('/webhook', (req, res) => {
    const mode = req.query['hub.mode'];
    const token = req.query['hub.verify_token'];
    const challenge = req.query['hub.challenge'];
    
    console.log('🔍 Verificando webhook:', { mode, token });
    
    if (mode === 'subscribe' && token === VERIFY_TOKEN) {
        console.log('✅ Webhook verificado');
        res.status(200).send(challenge);
    } else {
        console.log('❌ Token incorrecto');
        res.sendStatus(403);
    }
});

app.post('/webhook', async (req, res) => {
    try {
        console.log('📥 Webhook recibido:', JSON.stringify(req.body, null, 2));
        
        if (req.body?.object === 'whatsapp_business_account') {
            const entry = req.body.entry?.[0];
            const changes = entry?.changes?.[0];
            const value = changes?.value;
            
            if (value?.messages) {
                const message = value.messages[0];
                const from = message.from;
                
                if (message.type === 'text') {
                    const texto = message.text.body;
                    console.log(`💬 Mensaje de ${from}: ${texto}`);
                    
                    const respuesta = await obtenerRespuestaIA(from, texto);
                    await enviarMensajeWhatsApp(from, respuesta);
                }
            }
        }
        
        res.sendStatus(200);
    } catch (error) {
        console.error('❌ Error en webhook:', error);
        res.sendStatus(500);
    }
});

// ==========================================
// PRUEBA LOCAL
// ==========================================

app.post('/test', async (req, res) => {
    const texto = req.body?.text || '';
    const respuesta = await obtenerRespuestaIA(from, texto);
    
    res.json({
        ok: true,
        recibido: texto,
        respuesta
    });
});

// ==========================================
// PRUEBA ENVÍO WHATSAPP
// ==========================================

app.post('/send-test', async (req, res) => {
    try {
        const numero = req.body?.to;
        const texto = req.body?.text || 'Prueba Trinity 3D';
        
        if (!numero) {
            return res.status(400).json({
                ok: false,
                error: 'Debes enviar el campo "to"'
            });
        }
        
        const resultado = await enviarMensajeWhatsApp(numero, texto);
        
        res.json({
            ok: true,
            meta: resultado
        });
    } catch (error) {
        console.error('Error en prueba:', error.response?.data || error.message);
        res.status(500).json({
            ok: false,
            error: error.response?.data || error.message
        });
    }
});

// ==========================================
// ESTADO DEL SERVIDOR
// ==========================================

app.get('/', (req, res) => {
    res.json({
        status: 'ok',
        bot: 'Trinity 3D',
        whatsapp: Boolean(WHATSAPP_TOKEN && WHATSAPP_PHONE_ID),
        phone_id: WHATSAPP_PHONE_ID,
        version: WHATSAPP_API_VERSION,
        port: PORT
    });
});

// ==========================================
// INICIAR SERVIDOR
// ==========================================

app.listen(PORT, () => {
    console.log('');
    console.log('========================================');
    console.log('🤖 TRINITY 3D BOT ACTIVO');
    console.log('========================================');
    console.log(`📡 Servidor: http://localhost:${PORT}`);
    console.log(`🧪 Prueba local: POST http://localhost:${PORT}/test`);
    console.log(`📱 Webhook: http://localhost:${PORT}/webhook`);
    console.log(`📤 Test WhatsApp: POST http://localhost:${PORT}/send-test`);
    console.log(`📞 Phone ID: ${WHATSAPP_PHONE_ID}`);
    console.log(`🔧 Versión API: ${WHATSAPP_API_VERSION}`);
    console.log('========================================');
    console.log('');
});



