var sqlite3 = require("sqlite3").verbose();
var db = new sqlite3.Database("./db.sqlite");

db.serialize(function () {
  db.run(`
  CREATE TABLE User (
    id SERIAL PRIMARY KEY NOT NULL,
    name VARCHAR(255),
    email VARCHAR(255) UNIQUE NOT NULL
  );
  
  CREATE TABLE Post (
    id SERIAL PRIMARY KEY NOT NULL,
    title VARCHAR(255) NOT NULL,
    "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
    content TEXT,
    published BOOLEAN NOT NULL DEFAULT false,
    "authorId" INTEGER NOT NULL,
    FOREIGN KEY ("authorId") REFERENCES User(id)
  );
  
  CREATE TABLE Profile (
    id SERIAL PRIMARY KEY NOT NULL,
    bio TEXT,
    "userId" INTEGER UNIQUE NOT NULL,
    FOREIGN KEY ("userId") REFERENCES "public"."User"(id)
  );
`);
  /*
  var stmt = db.prepare("INSERT INTO lorem VALUES (?)");
  for (var i = 0; i < 10; i++) {
      stmt.run("Ipsum " + i);
  }
  stmt.finalize();

  db.each("SELECT rowid AS id, info FROM lorem", function(err, row) {
      console.log(row.id + ": " + row.info);
  });
*/
});

db.close();
