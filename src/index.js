const express = require("express");
const cors = require("cors");
const mysql = require("mysql2/promise");
const swaggerUi = require("swagger-ui-express");

let connection;

const server = express();
server.use(cors());
server.use(express.json({ limit: "25mb" }));

// Configurar el motor de plantillas
server.set("view engine", "ejs");

const serverPort = process.env.PORT || 4001;
server.listen(serverPort, () => {
  console.log(`Server listening at http://localhost:${serverPort}`);
});

const swaggerFile = require("./swagger.json");

//Especificar en el server use
server.use("/doc", swaggerUi.serve, swaggerUi.setup(swaggerFile));

mysql
  .createConnection({
    host: "sql.freedb.tech",
    database: "freedb_proyectos_y_ya_estaría",
    user: "freedb_adalabers",
    password: "H8@!*NM%M@K2Gj7",
  })
  .then((conn) => {
    connection = conn;
    connection
      .connect()
      .then(() => {
        console.log(
          `Conexión establecida con la base de datos (identificador=${connection.threadId})`
        );
      })
      .catch((err) => {
        console.error("Error de conexion: " + err.stack);
      });
  })
  .catch((err) => {
    console.error("Error de configuración: " + err.stack);
  });

server.get("/api/projects/all", (req, res) => {
  console.log("Pidiendo a la base de datos");
  connection
    .query(
      "SELECT * FROM projects, authors WHERE projects.fkAuthor = authors.idAuthor"
    )
    .then(([results, fields]) => {
      console.log("Información recuperada:");
      results.forEach((result) => {
        /* console.log(result); */
      });

      res.json(results);
    })
    .catch((err) => {
      throw err;
    });
});

server.post("/api/projects/add", (req, res) => {
  //console.log('');

  const data = req.body;
  console.log(data);

  let sqlAuthor = "INSERT INTO authors (autor, job, image) VALUES (?, ?, ?)";
  let valuesAuthor = [data.autor, data.job, data.image];

  connection
    .query(sqlAuthor, valuesAuthor)
    .then(([results, fields]) => {
      console.log(results);

      let sqlProject =
        "INSERT INTO projects (name, slogan, repo, demo, technologies, `desc`, photo, fkAuthor) VALUES(?, ?, ?, ?, ?, ?, ?, ?) ";

      let valuesProject = [
        data.name,
        data.slogan,
        data.repo,
        data.demo,
        data.technologies,
        data.desc,
        data.photo,
        results.insertId,
      ];

      connection
        .query(sqlProject, valuesProject)
        .then(([results, fields]) => {
          console.log(results);
          let response = {
            success: true,
            cardURL: `http://localhost:4001/api/projects/detail/${results.insertId}`,
          };
          res.json(response);
        })
        .catch((err) => {
          throw err;
        });
    })

    .catch((err) => {
      throw err;
    });
});

// DINÁMICOS
// Insertar un proyecto Endpoint / projects / add
server.get("/api/projects/detail/:projectID", (req, res) => {
  const projectId = req.params.projectID;
  const sql =
    "SELECT * FROM projects, authors WHERE projects.fkAuthor=authors.idAuthor and idProject = ?";
  connection
    .query(sql, [projectId])
    .then(([results, fields]) => {
      res.render("project_detail", results[0]);
    })
    .catch((err) => {
      throw err;
    });
});

// ESTÁTICOS
server.use(express.static("./src/public-react"));
server.use(express.static("./src/public-images"));
server.use(express.static("./src/public-css/"));
