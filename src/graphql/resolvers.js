const axios = require('axios');
const bcrypt = require('bcrypt'); // ✅ Importamos bcrypt para hashear la contraseña
const User = require('../models/user');

const resolvers = {
    Mutation: {
        updateUser: async (_, { id, input }) => {
            try {
                // Buscar el user en la base de datos local
                const user = await User.findByPk(id);
                if (!user) throw new Error(`User with ID ${id} not found`);

                // ✅ Si se envía una nueva contraseña, la encriptamos antes de guardarla
                if (input.password_hash) {
                    console.log("📌 Hasheando nueva contraseña...");
                    input.password_hash = await bcrypt.hash(input.password_hash, 10);
                }

                // Actualizar el user en la base de datos local
                await user.update(input);
                console.log(`✅ User con ID ${id} actualizado en la base de Update`);

                // Notificar a los otros microservicios
                const instances = [
                    'http://localhost:5005/sync-update', // Microservicio de Crear
                    'http://localhost:5001/sync-update',  // Microservicio de Eliminar
                    'http://localhost:5006/sync-update'  // ✅ Microservicio de Leer
                ];

                for (const instance of instances) {
                    try {
                        await axios.post(instance, { id, ...input });
                        console.log(`✅ Notificación enviada a ${instance} para sincronizar actualización`);
                    } catch (error) {
                        console.error(`❌ Error notificando a ${instance}:`, error.message);
                    }
                }

                return user;
            } catch (error) {
                console.error('❌ Error actualizando user:', error);
                throw new Error('Failed to update user');
            }
        }
    }
};

module.exports = resolvers;
