const express = require('express');
const bodyParser = require('body-parser');
const User = require('../models/user');
const authenticateToken = require('../middlewares/authMiddleware.js'); // ✅ Middleware para verificar token

const router = express.Router();
router.use(bodyParser.json()); // ✅ Se aplica bodyParser solo una vez

// ✅ Endpoint para sincronizar creación de usuarios desde el microservicio de Crear
router.post('/sync-create', async (req, res) => {
    console.log('📌 Solicitud recibida en /sync-create:', req.body);
    const { id, first_name, last_name, identification_number, email, password_hash, phone_number } = req.body;

    try {
        // Verifica si el proveedor ya existe en Update
        const existingUser = await User.findByPk(id);
        if (!existingUser) {
            await User.create({ id, first_name, last_name, identification_number, email, password_hash, phone_number });
            console.log(`✅ User con ID ${id} sincronizado en Update`);
        } else {
            console.log(`⚠️ User con ID ${id} ya existe en Update`);
        }

        res.status(200).send({ message: `User con ID ${id} sincronizado correctamente en Update` });
    } catch (error) {
        console.error('❌ Error sincronizando creación de user en Update:', error);
        res.status(500).send({ error: 'Failed to sync user creation' });
    }
});
// ✅ Endpoint para sincronizar actualización desde el microservicio de Update
router.post('/sync-update', async (req, res) => {
    console.log('📌 Solicitud recibida en /sync-update:', req.body);
    const { id, first_name, last_name, identification_number, email, phone_number } = req.body;

    try {
        const user = await User.findByPk(id);
        if (user) {
            await user.update({ first_name, last_name, identification_number, email, phone_number });
            console.log(`✅ Usuario con ID ${id} actualizado en la base de Leer`);
        } else {
            console.log(`⚠️ Usuario con ID ${id} no encontrado en la base de Leer`);
        }

        res.status(200).send({ message: `Usuario con ID ${id} actualizado correctamente en Leer` });
    } catch (error) {
        console.error('❌ Error sincronizando actualización de usuario en Leer:', error);
        res.status(500).send({ error: 'Failed to sync user update' });
    }
});

// ✅ Endpoint para sincronizar eliminación de usuarios desde el microservicio de Eliminar
router.post('/sync-delete', async (req, res) => {
    console.log('📌 Solicitud recibida en /sync-delete:', req.body);
    const { id } = req.body;

    try {
        const user = await User.findByPk(id);
        if (user) {
            await user.destroy();
            console.log(`✅ User con ID ${id} eliminado en la base de Editar`);
        } else {
            console.log(`⚠️ User con ID ${id} no encontrado en la base de Editar`);
        }

        res.status(200).send({ message: `User con ID ${id} eliminado correctamente en Editar` });
    } catch (error) {
        console.error('❌ Error sincronizando eliminación de user en Editar:', error);
        res.status(500).send({ error: 'Failed to sync provider delete' });
    }
});

// ✅ Endpoint para actualizar la información del usuario autenticado
router.put('/me', authenticateToken, async (req, res) => {
    try {
        const { first_name, last_name, identification_number, email, phone_number } = req.body;

        // 🔍 Obtener el usuario autenticado desde el token
        const user = await User.findByPk(req.user.id);
        if (!user) {
            return res.status(404).json({ error: 'Usuario no encontrado' });
        }

        // ✅ Actualizar los campos permitidos
        user.first_name = first_name || user.first_name;
        user.last_name = last_name || user.last_name;
        user.identification_number = identification_number || user.identification_number;
        user.email = email || user.email;
        user.phone_number = phone_number || user.phone_number;

        await user.save();

        console.log(`✅ Usuario con ID ${user.id} actualizado correctamente`);
        res.json({ message: 'Usuario actualizado correctamente', user });

    } catch (error) {
        console.error('❌ Error actualizando usuario:', error.message);
        res.status(500).json({ error: 'Error en el servidor' });
    }
});



module.exports = router;
