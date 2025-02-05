const fs = require('fs');
const path = require('path');
const { ApolloServer } = require('apollo-server');
const express = require('express');
const bodyParser = require('body-parser');
const sequelize = require('./config/database');
const resolvers = require('./graphql/resolvers');
const userRoutes = require('./routes/userRoutes');

const app = express();
app.use(bodyParser.json());
app.use(userRoutes); // ✅ Registrar las rutas

// ✅ Configurar Apollo Server con cacheo deshabilitado
const typeDefs = fs.readFileSync(path.join(__dirname, 'graphql/schema.graphql'), 'utf-8');
const server = new ApolloServer({
    typeDefs,
    resolvers,
    cache: 'bounded', // ✅ Deshabilita cache persistente
    introspection: true
});

// ✅ Sincronizar base de datos antes de iniciar los servidores
sequelize.sync().then(() => {
    console.log('✅ Database synced successfully!');

    server.listen({ port: 4007 }).then(({ url }) => {
        console.log(`🚀 GraphQL server ready at ${url}`);
    });

    app.listen(5007, () => {
        console.log(`REST server listening on port 5007`);
    });
}).catch(err => {
    console.error('❌ Error syncing database:', err);
});
