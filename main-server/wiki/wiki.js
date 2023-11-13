/* Добавление __dirname в файл */
import { fileURLToPath } from 'url';
import { dirname } from 'path';
const __dirname = dirname(fileURLToPath(import.meta.url));

/* Добавление поддержки require в ES Modules */
import { createRequire } from "module";
const require = createRequire(import.meta.url);

/* Чтение информации о файлах из определённой директории */
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import fs from 'fs';
import path from 'path';
// const __dirname = dirname(fileURLToPath(import.meta.url));
const __filename = import.meta.url;

const basename = path.basename(__filename);
const env = process.env.NODE_ENV || 'development';

fs
    .readdirSync(__dirname + '/models')               // Синхронное чтение
    .filter(file => {                                 // Фильтрация файлов
        return (
            file.indexOf('.') !== 0 &&
            file !== basename &&
            file.slice(-3) === '.js' &&
            file.indexOf('.test.js') === -1
        );
    })
    .forEach(async file => {
        console.log(`db.${file.split('.')[0]} = ${file.split('.')[0]}(sequelize, Sequelize.DataTypes);`);
        const module = await import('./models/' + file);
        const model = module.default(sequelize, Sequelize.DataTypes);
        db[model.name] = model;
    });


/* Конвератция JSON в YAML (для автоматического документирования эндпоинтов) */
// https://www.json2yaml.com/convert-yaml-to-json

/* Документация к библиотеке */
// https://libraries.io/github/pgroot/express-swagger-generator