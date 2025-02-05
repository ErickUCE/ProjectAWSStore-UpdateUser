const { Sequelize, DataTypes } = require('sequelize');
require('dotenv').config();

// Verificar que se están usando las IPs correctas
console.log("Conectando a Crear en:", process.env.DB_HOST_CREATE);
console.log("Conectando a UPdate en:", process.env.DB_HOST_UPDATE);

// Conexión a la base de datos del microservicio de Crear
const createDB = new Sequelize(process.env.DB_NAME, process.env.DB_USER, process.env.DB_PASSWORD, {
    host: process.env.DB_HOST_CREATE, // ⚠️ Revisar si es la IP correcta
    dialect: 'mysql',
    logging: false,
});

// Conexión a la base de datos del microservicio de Read
const updateDB = new Sequelize(process.env.DB_NAME, process.env.DB_USER, process.env.DB_PASSWORD, {
    host: process.env.DB_HOST_UPDATE, // ⚠️ Revisar si es la IP correcta
    dialect: 'mysql',
    logging: false,
});

// Modelo de User
const UserModel = (sequelize) =>
    sequelize.define('User', {
        id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
        first_name: { type: DataTypes.STRING, allowNull: false },
        last_name: { type: DataTypes.STRING, allowNull: false },
        identification_number: { type: DataTypes.STRING, unique: true, allowNull: false },
        email: { type: DataTypes.STRING, unique: true, allowNull: false, validate: { isEmail: true } },
        password_hash: { type: DataTypes.STRING, allowNull: false },
        phone_number: { type: DataTypes.STRING, allowNull: false }
    }, { 
        freezeTableName: true, 
        timestamps: false // ✅ Sequelize manejará las fechas pero no las agregaremos en GraphQL
    });

// Instancias del modelo en cada base de datos
const UserInCreate = UserModel(createDB);
const UserInUpdate = UserModel(updateDB);

// Función de sincronización
async function syncTables() {
    try {
        await createDB.authenticate();
        await updateDB.authenticate();
        console.log('✅ Conexión exitosa a ambas bases de datos');

        const usersInCreate = await UserInCreate.findAll();
        console.log(`🔄 Se encontraron ${usersInCreate.length} users en Crear`);

        for (const user of usersInCreate) {
            const existingUser = await UserInUpdate.findByPk(user.id);
            if (!existingUser) {
                await UserInUpdate.create(user.toJSON());
                console.log(`✅ User con ID ${user.id} sincronizado en Read`);
            } else {
                console.log(`⚠️ User con ID ${user.id} ya existe en Read`);
            }
        }

        console.log('✅ Sincronización completada');
    } catch (error) {
        console.error('❌ Error sincronizando las tablas:', error);
    } finally {
        await createDB.close();
        await updateDB.close();
    }
}

syncTables();
