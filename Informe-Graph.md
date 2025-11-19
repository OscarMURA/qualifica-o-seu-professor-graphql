# Informe del proyecto: **Qualifica o seu Professor – GraphQL API**

Este documento describe de forma explicativa:
- Cómo ejecutar el proyecto (actuando como README de ejecución).
- Qué endpoints expone la API (operaciones GraphQL).
- Qué tipos de documentos/datos recibe y devuelve cada parte principal del sistema.

El objetivo es que cualquier persona (docente o compañero) pueda:
- Levantar la API rápidamente en local.
- Entender qué problema resuelve el proyecto.
- Probar los endpoints y comprender la estructura de los datos que se intercambian.

---

## 1. Descripción general del sistema

El proyecto implementa una **API GraphQL** para calificar y comentar profesores universitarios.  
Permite:
- Registrar usuarios (estudiantes y administradores) con **autenticación JWT**.
- Gestionar **universidades**, **profesores** y **comentarios**.
- Consultar el **rating promedio** de cada profesor.
- Controlar el acceso mediante **roles** (`admin`, `student`) y **guards** de NestJS.

Tecnologías principales:
- **NestJS 11** (framework backend).
- **GraphQL** (API basada en esquema).
- **TypeORM + PostgreSQL** (acceso a datos).
- **JWT** (autenticación).
- **TypeScript** (tipado estático) y **class-validator** (validación de DTOs).

El esquema GraphQL completo se encuentra en `src/schema.gql`.

---

## 2. README de ejecución (cómo correr el proyecto)

### 2.1. Requisitos previos
- **Node.js** 18 o superior (se recomienda 18–22).
- **npm** o **bun** para manejar dependencias.
- **PostgreSQL 14+**
  - Opcionalmente usando **Docker** mediante `docker-compose.yml`.

### 2.2. Clonar e instalar dependencias

```bash
git clone <URL_DEL_REPOSITORIO>
cd qualifica-o-seu-professor-graphql

# Instalar dependencias con npm
npm install

# o con bun
bun install
```

### 2.3. Configurar la base de datos

**Opción A – PostgreSQL local instalado en el sistema**

1. Crear una base de datos, por ejemplo `qualifica_professor`.
2. Configurar las credenciales en un archivo `.env` como se muestra más abajo.

**Opción B – Usar Docker (solo base de datos)**

El archivo `docker-compose.yml` levanta un contenedor de PostgreSQL:

```yaml
services:
  db:
    image: postgres:15-alpine
    container_name: graphql-basics-db
    restart: always
    environment:
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: password
      POSTGRES_DB: prueba
    ports:
      - "5433:5432"
```

Para iniciar la base de datos con Docker:

```bash
docker compose up -d
```

En este caso, ajusta las variables de entorno para que el backend apunte a:
- `DB_HOST=localhost`
- `DB_PORT=5433`
- `DB_USERNAME=postgres`
- `DB_PASSWORD=password`
- `DB_DATABASE=prueba`

### 2.4. Variables de entorno

Crear un archivo `.env` en la raíz del proyecto con, al menos, estas variables:

```env
# Base de datos
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=tu_password
DB_DATABASE=qualifica_professor

# JWT
JWT_SECRET=tu_clave_super_secreta

# Aplicación
PORT=9090
NODE_ENV=development
```

Ajustar `DB_PORT`, `DB_PASSWORD` y `DB_DATABASE` según el escenario que se esté usando (local o Docker).

### 2.5. Ejecutar la aplicación

```bash
# Modo desarrollo (watch)
npm run start:dev

# Modo producción
npm run build
npm run start:prod
```

Una vez levantada la app, la API GraphQL estará disponible en:
- `http://localhost:9090/api/graphql`

Desde ahí se puede utilizar **GraphQL Playground** para ejecutar queries y mutations.

### 2.6. Inicializar datos de prueba (seed)

El proyecto incluye un módulo de **seed** que inserta:
- Universidades
- Profesores
- Estudiantes
- Comentarios
- Un usuario administrador por defecto

Para ejecutarlo, desde GraphQL Playground o desde Postman, hacer la siguiente mutation:

```graphql
mutation {
  executeSeed {
    message
    admin { id email }
    universities
    professors
    students
    comments
  }
}
```

La respuesta incluye:
- Un mensaje de estado.
- Las cantidades insertadas.
- Las credenciales del **admin** creado (email).
  - La contraseña por defecto suele ser `Admin123!` (ver documentación del seed si se modifica).

Para limpiar la base de datos, existe también:

```graphql
mutation {
  executeUnseed {
    message
  }
}
```

---

## 3. Endpoints de la API: visión general

Aunque en GraphQL no hablamos de endpoints REST separados, toda la comunicación se realiza sobre **un único endpoint HTTP**:

- **Método HTTP**: `POST`
- **URL**: `http://localhost:9090/api/graphql`
- **Cabeceras comunes**:
  - `Content-Type: application/json`
  - `Authorization: Bearer <token>` (solo cuando sea requerida autenticación)

Dentro del cuerpo de la petición se envían:
- El **documento GraphQL** (query o mutation).
- Un objeto `variables` en formato JSON, con los datos de entrada.

El esquema GraphQL, definido en `src/schema.gql`, expone:

### 3.1. Operaciones de consulta (`Query`)
- `me`: datos del usuario autenticado.
- `users`: listado completo de usuarios (solo admin).
- `user(id: ID!)`: usuario por ID (solo admin).
- `universities`: todas las universidades.
- `university(id: ID!)`: universidad por ID.
- `professors(filterInput: FilterProfessorInput)`: lista de profesores (con filtros opcionales).
- `professor(id: ID!)`: profesor por ID.
- `comments(filterInput: FilterCommentInput)`: comentarios paginados.
- `comment(id: ID!)`: comentario por ID.
- `professorRating(professorId: ID!)`: rating promedio y total de comentarios de un profesor.

### 3.2. Operaciones de modificación (`Mutation`)
- `signup(signupInput: SignupInput!)`: registro de nuevo estudiante.
- `login(loginInput: LoginInput!)`: login y obtención de JWT.
- `createUser(createUserInput: CreateUserInput!)`: crear usuario (admin).
- `updateUser(id: ID!, updateUserInput: UpdateUserInput!)`: actualizar usuario (admin).
- `removeUser(id: ID!)`: desactivar usuario (admin).
- `createUniversity(createUniversityInput: CreateUniversityInput!)`: crear universidad (admin).
- `updateUniversity(id: ID!, updateUniversityInput: UpdateUniversityInput!)`: actualizar universidad (admin).
- `removeUniversity(id: ID!)`: eliminar universidad (admin).
- `createProfessor(createProfessorInput: CreateProfessorInput!)`: crear profesor (admin).
- `updateProfessor(id: ID!, updateProfessorInput: UpdateProfessorInput!)`: actualizar profesor (admin).
- `removeProfessor(id: ID!)`: eliminar profesor (admin).
- `createComment(createCommentInput: CreateCommentInput!)`: crear comentario (student o admin).
- `updateComment(id: ID!, updateCommentInput: UpdateCommentInput!)`: actualizar comentario (autor o admin).
- `removeComment(id: ID!)`: eliminar comentario (autor o admin).
- `executeSeed`: popular base de datos con datos de prueba.
- `executeUnseed`: limpiar datos de prueba.

En la siguiente sección se detalla qué **documentos de entrada** (tipos de datos) recibe cada operación importante.

---

## 4. Tipos de documentos de entrada y salida

En GraphQL, los “documentos” de entrada se representan como **Input Types** y las respuestas como **Object Types**. A continuación se resumen los más relevantes, tal como están definidos en `src/schema.gql`.

### 4.1. Autenticación

#### 4.1.1. `SignupInput`

Tipo de documento que recibe la operación `signup`:

```graphql
input SignupInput {
  email: String!
  password: String!
  fullName: String!
}
```

Ejemplo de variables (JSON):

```json
{
  "signupInput": {
    "email": "student@test.com",
    "password": "Password123!",
    "fullName": "Juan Pérez"
  }
}
```

Validaciones típicas (a nivel de DTO en NestJS):
- `email`: formato válido y único.
- `password`: longitud mínima 8, con mayúsculas, minúsculas y números.
- `fullName`: mínimo 3 caracteres.

Respuesta (`AuthReponse`):

```graphql
type AuthReponse {
  user: User!
  token: String!
}
```

#### 4.1.2. `LoginInput`

Usado por la mutation `login`:

```graphql
input LoginInput {
  email: String!
  password: String!
}
```

Variables JSON:

```json
{
  "loginInput": {
    "email": "student@test.com",
    "password": "Password123!"
  }
}
```

La respuesta es también un `AuthReponse` con:
- `token`: JWT a incluir en el header `Authorization`.
- `user`: datos básicos del usuario.

### 4.2. Usuarios

#### 4.2.1. `CreateUserInput`

```graphql
input CreateUserInput {
  email: String!
  password: String!
  fullName: String!
  roles: [String!]
}
```

Uso: `createUser(createUserInput: CreateUserInput!): User!`  
Solo accesible para rol **admin**.

Ejemplo de variables:

```json
{
  "createUserInput": {
    "email": "nuevo@test.com",
    "password": "SecurePass123!",
    "fullName": "María García",
    "roles": ["student"]
  }
}
```

Validaciones de negocio:
- El email se normaliza a minúsculas y debe ser único.
- La contraseña debe cumplir reglas de seguridad (letras, número, carácter especial).
- Si no se indica `roles`, se asigna por defecto `["student"]`.

#### 4.2.2. `UpdateUserInput`

```graphql
input UpdateUserInput {
  email: String
  password: String
  fullName: String
  roles: [String!]
}
```

Uso: `updateUser(id: ID!, updateUserInput: UpdateUserInput!): User!`  
Permite actualizar datos puntuales (al ser opcionales).  
Si se modifica `password`, se vuelve a hashear.

### 4.3. Universidades

#### 4.3.1. `CreateUniversityInput`

```graphql
input CreateUniversityInput {
  name: String!
  location: String!
}
```

Uso: `createUniversity(createUniversityInput: CreateUniversityInput!): University!` (solo admin).

Variables de ejemplo:

```json
{
  "createUniversityInput": {
    "name": "Universidad del Valle",
    "location": "Cali, Colombia"
  }
}
```

#### 4.3.2. `UpdateUniversityInput`

```graphql
input UpdateUniversityInput {
  name: String
  location: String
}
```

Permite cambios parciales en nombre y/o ubicación.

### 4.4. Profesores

#### 4.4.1. `CreateProfessorInput`

```graphql
input CreateProfessorInput {
  name: String!
  department: String!
  universityId: ID!
}
```

Uso: `createProfessor(createProfessorInput: CreateProfessorInput!): Professor!` (solo admin).

Variables:

```json
{
  "createProfessorInput": {
    "name": "Dr. Juan Carlos Pérez",
    "department": "Ingeniería de Sistemas",
    "universityId": "UUID_UNIVERSIDAD"
  }
}
```

Validaciones:
- `universityId` debe ser un UUID válido y referenciar una universidad existente.

#### 4.4.2. `UpdateProfessorInput`

```graphql
input UpdateProfessorInput {
  name: String
  department: String
  universityId: ID
}
```

Uso: `updateProfessor(id: ID!, updateProfessorInput: UpdateProfessorInput!): Professor!`

### 4.5. Comentarios

#### 4.5.1. `CreateCommentInput`

```graphql
input CreateCommentInput {
  content: String!
  rating: Int!
  professorId: ID!
}
```

Uso: `createComment(createCommentInput: CreateCommentInput!): Comment!`  
Requiere un usuario autenticado con rol `student` o `admin`.

Variables JSON:

```json
{
  "createCommentInput": {
    "content": "Excelente profesor, muy claro y dispuesto a ayudar.",
    "rating": 5,
    "professorId": "UUID_PROFESOR"
  }
}
```

Validaciones de negocio destacadas:
- `content`: longitud mínima (10) y máxima (500).
- `rating`: entero entre 1 y 5.
- Se impide comentar dos veces al mismo profesor por el mismo usuario.
- El usuario autenticado se asocia automáticamente como `student` del comentario.

#### 4.5.2. `UpdateCommentInput`

```graphql
input UpdateCommentInput {
  content: String
  rating: Int
  professorId: ID
}
```

Uso: `updateComment(id: ID!, updateCommentInput: UpdateCommentInput!): Comment!`  
Solo el autor del comentario o un admin pueden modificarlo.

### 4.6. Filtros y paginación

#### 4.6.1. `FilterProfessorInput`

```graphql
input FilterProfessorInput {
  universityId: String
  search: String
}
```

Uso en `professors(filterInput: FilterProfessorInput): [Professor!]!`  
Permite:
- Filtrar por universidad.
- Realizar búsqueda textual por nombre de profesor.

#### 4.6.2. `FilterCommentInput`

```graphql
input FilterCommentInput {
  professorId: String
  userId: String
  search: String
  page: Int = 1
  limit: Int = 20
}
```

Uso en `comments(filterInput: FilterCommentInput): PaginatedComments!`  
Soporta:
- Filtrar por profesor (`professorId`).
- Filtrar por usuario (`userId`).
- Búsqueda en el contenido del comentario (`search`).
- Paginación (`page`, `limit`).

La respuesta es de tipo `PaginatedComments`:

```graphql
type PaginatedComments {
  data: [Comment!]!
  page: Int!
  limit: Int!
  total: Int!
}
```

---

## 5. Tipos principales de salida (modelos de dominio)

Para completar la visión de los “documentos” que intercambia la API, se listan los tipos de salida más importantes:

```graphql
type User {
  id: ID!
  email: String!
  fullName: String!
  isActive: Boolean!
  roles: [String!]!
  createdAt: DateTime!
  updatedAt: DateTime!
}

type University {
  id: ID!
  name: String!
  location: String!
  createdAt: DateTime!
  updatedAt: DateTime!
}

type Professor {
  id: ID!
  name: String!
  department: String!
  university: University!
  createdAt: DateTime!
  updatedAt: DateTime!
}

type Comment {
  id: ID!
  content: String!
  rating: Int!
  professor: Professor!
  student: User!
  createdAt: DateTime!
  updatedAt: DateTime!
}

type ProfessorRating {
  averageRating: Float!
  totalComments: Int!
}
```

Estos tipos representan los “documentos” que el frontend puede esperar recibir de la API.

---

## 6. Sistema de roles y seguridad

El sistema de autenticación y autorización se basa en:
- **JWT**: emitido en las operaciones `signup` y `login`.
- **Guards y decoradores** de NestJS para proteger resolvers:
  - Decoradores como `@Auth()` especifican roles permitidos.
  - `JwtAuthGuard` valida el token.
  - `@CurrentUser()` inyecta el usuario autenticado en los resolvers.

Resumen por rol:
- **Admin**
  - Puede gestionar usuarios, universidades, profesores y comentarios.
  - Puede acceder a las queries administrativas (`users`, `user`, etc.).
- **Student**
  - Puede ver universidades, profesores y comentarios.
  - Puede crear, actualizar y eliminar **sus propios** comentarios.
  - No puede crear usuarios, profesores ni universidades.
- **Público (no autenticado)**
  - Puede consultar universidades, profesores, comentarios y ratings, pero no modificarlos.

---

## 7. Tests y calidad

El proyecto incluye una batería extensa de tests con Jest:

Comandos principales:

```bash
# Tests unitarios
npm run test

# Cobertura
npm run test:cov

# Tests end-to-end
npm run test:e2e
```

La configuración de Jest está en `package.json` (sección `"jest"`), con thresholds de cobertura definidos y mapeo de módulos para `src/...`.

---

## 8. Recursos adicionales y Postman

Para facilitar las pruebas de la API se incluye:
- `postman_collection.json`: colección importable en Postman con más de 40 peticiones.
- `postman_environment.json`: entorno con variables (por ejemplo, `graphDomain`).
- `postman.md`: guía explicativa para usar la colección, con ejemplos de:
  - Autenticación y guardado automático del token.
  - Creación y consulta de usuarios, universidades, profesores y comentarios.
  - Uso de variables como `{{lastCreatedUserId}}`, `{{lastCreatedProfessorId}}`, etc.

Se recomienda seguir el flujo descrito en `postman.md`:
1. Ejecutar `executeSeed`.
2. Hacer login como admin.
3. Probar operaciones públicas.
4. Crear y gestionar entidades con el rol adecuado.

---

## 9. Conclusión

Este proyecto ofrece un ejemplo completo de:
- Diseño de una API GraphQL con **esquema bien definido**.
- Separación clara de responsabilidades (usuarios, universidades, profesores, comentarios).
- **Validaciones exhaustivas** y reglas de negocio relevantes (evitar duplicados, control de propiedad de comentarios, etc.).
- **Autenticación JWT** y control de roles.

La documentación proporcionada (este informe, `postman.md` y la colección de Postman) cumple con el criterio de:
- README de ejecución claro.
- Descripción detallada de endpoints.
- Especificación de los tipos de documentos que reciben y devuelven las operaciones.

Con este material, un evaluador puede levantar el sistema, probarlo y entender el diseño de datos sin necesidad de inspeccionar el código fuente en detalle.

