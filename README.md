# 🎓 Qualifica o seu Professor - GraphQL API

<p align="center">
  <a href="http://nestjs.com/" target="blank"><img src="https://nestjs.com/img/logo-small.svg" width="120" alt="Nest Logo" /></a>
</p>

<p align="center">API GraphQL para calificar y comentar profesores universitarios con autenticación JWT y control de roles.</p>

<p align="center">
  <img src="https://img.shields.io/badge/NestJS-11.0.1-E0234E?logo=nestjs" alt="NestJS" />
  <img src="https://img.shields.io/badge/GraphQL-16.12.0-E10098?logo=graphql" alt="GraphQL" />
  <img src="https://img.shields.io/badge/TypeScript-5.0-3178C6?logo=typescript" alt="TypeScript" />
  <img src="https://img.shields.io/badge/Test%20Coverage-81.95%25-brightgreen" alt="Coverage" />
  <img src="https://img.shields.io/badge/PostgreSQL-TypeORM-336791?logo=postgresql" alt="PostgreSQL" />
</p>

---

## 📋 Descripción

Sistema completo de gestión de universidades, profesores y comentarios con:
- ✅ **Autenticación JWT** con roles diferenciados (Admin/Student)
- ✅ **GraphQL Schema auto-generado** (`src/schema.gql`)
- ✅ **Autorización por roles** con decoradores personalizados
- ✅ **Validaciones exhaustivas** con class-validator
- ✅ **Fragments GraphQL** para reutilización de código
- ✅ **81.95% Test Coverage** (424 tests pasando)
- ✅ **Paginación y filtros** avanzados
- ✅ **Seed automático** con datos de prueba

---

## 🚀 Inicio Rápido

### Requisitos Previos
- Node.js 18+ o Bun
- PostgreSQL 14+
- npm o bun

### Instalación

```bash
# Clonar el repositorio
git clone <repository-url>
cd qualifica-o-seu-professor-graphql

# Instalar dependencias
npm install
# o
bun install
```

### Configuración de Variables de Entorno

Crear archivo `.env` en la raíz:

```env
# Database
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=your_password
DB_DATABASE=qualifica_professor

# JWT
JWT_SECRET=your_super_secret_key_change_in_production

# Application
PORT=9090
NODE_ENV=development
```

### Ejecutar la Aplicación

```bash
# Modo desarrollo (watch mode)
npm run start:dev

# Modo producción
npm run build
npm run start:prod
```

La API estará disponible en: **http://localhost:9090/api/graphql**

### Inicializar Base de Datos con Datos de Prueba

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

**Credenciales de Admin generadas:**
- Email: Se muestra en la respuesta del seed
- Password: `Admin123!`

---

## 📚 Documentación Completa

- **[POSTMAN_GUIDE.md](./POSTMAN_GUIDE.md)** - Guía completa de Postman (40+ requests)
- **[GRAPHQL_EXAMPLES.md](./GRAPHQL_EXAMPLES.md)** - 15+ ejemplos de GraphQL y fragments
- **[postman_collection.json](./postman_collection.json)** - Colección importable
- **[DOCUMENTACION_RESUMEN.md](./DOCUMENTACION_RESUMEN.md)** - Resumen general del proyecto

---

## 🔐 Sistema de Roles

### Admin (Superusuario)
- ✅ CRUD completo de **Usuarios**
- ✅ CRUD completo de **Universidades**
- ✅ CRUD completo de **Profesores**
- ✅ CRUD completo de **Comentarios** (propios y ajenos)
- ✅ Acceso a todas las queries

### Student (Usuario Normal)
- ✅ Ver su propio perfil (`me`)
- ✅ **Crear** comentarios
- ✅ **Actualizar/Eliminar** sus propios comentarios
- ✅ Ver universidades, profesores y comentarios (público)
- ❌ No puede gestionar usuarios
- ❌ No puede crear profesores o universidades

### Público (Sin autenticación)
- ✅ Listar universidades
- ✅ Buscar profesores (con filtros)
- ✅ Ver comentarios (con paginación)
- ✅ Ver ratings de profesores

---

## 📡 Endpoints GraphQL

### 🔑 Autenticación

#### Signup (Registro)
```graphql
mutation Signup($signupInput: SignupInput!) {
  signup(signupInput: $signupInput) {
    token
    user {
      id
      email
      fullName
      roles
      isActive
    }
  }
}
```

**Variables:**
```json
{
  "signupInput": {
    "email": "student@test.com",
    "password": "Password123!",
    "fullName": "Juan Pérez"
  }
}
```

**Validaciones:**
- ✅ Email válido (formato RFC 5322)
- ✅ Email único (no duplicado)
- ✅ Password: mínimo 8 caracteres, 1 mayúscula, 1 minúscula, 1 número
- ✅ FullName: mínimo 3 caracteres
- ✅ Rol por defecto: `student`

---

#### Login
```graphql
mutation Login($loginInput: LoginInput!) {
  login(loginInput: $loginInput) {
    token
    user {
      id
      email
      fullName
      roles
    }
  }
}
```

**Variables:**
```json
{
  "loginInput": {
    "email": "student@test.com",
    "password": "Password123!"
  }
}
```

**Validaciones:**
- ✅ Credenciales válidas (email + password)
- ✅ Usuario activo (isActive: true)
- ✅ Password hasheado con bcrypt

---

#### Me (Usuario Autenticado)
```graphql
query Me {
  me {
    id
    email
    fullName
    roles
    isActive
    createdAt
    updatedAt
  }
}
```

**Headers requeridos:**
```
Authorization: Bearer <token>
```

---

### 👥 Usuarios (Solo Admin)

#### Listar Usuarios
```graphql
query Users {
  users {
    id
    email
    fullName
    roles
    isActive
    createdAt
  }
}
```

**Rol requerido:** `admin`

---

#### Crear Usuario
```graphql
mutation CreateUser($createUserInput: CreateUserInput!) {
  createUser(createUserInput: $createUserInput) {
    id
    email
    fullName
    roles
    isActive
  }
}
```

**Variables:**
```json
{
  "createUserInput": {
    "email": "newuser@test.com",
    "password": "SecurePass123!",
    "fullName": "María García",
    "roles": ["student"]
  }
}
```

**Validaciones exhaustivas:**
- ✅ Email: formato válido, único, normalizado (lowercase)
- ✅ Password: min 8 caracteres, 1 mayúscula, 1 número, 1 carácter especial
- ✅ FullName: min 3 caracteres, max 100
- ✅ Roles: debe ser array de `['admin', 'student']`
- ✅ Email normalizado antes de guardar

**Rol requerido:** `admin`

---

#### Actualizar Usuario
```graphql
mutation UpdateUser($id: ID!, $updateUserInput: UpdateUserInput!) {
  updateUser(id: $id, updateUserInput: $updateUserInput) {
    id
    email
    fullName
    roles
    isActive
  }
}
```

**Variables:**
```json
{
  "id": "uuid-del-usuario",
  "updateUserInput": {
    "fullName": "María García Rodríguez",
    "isActive": true
  }
}
```

**Validaciones:**
- ✅ ID: UUID válido, usuario debe existir
- ✅ Email: si se actualiza, debe ser único
- ✅ Password: si se actualiza, se hashea automáticamente
- ✅ Roles: array válido

**Rol requerido:** `admin`

---

#### Eliminar Usuario (Soft Delete)
```graphql
mutation RemoveUser($id: ID!) {
  removeUser(id: $id) {
    id
    email
    isActive
  }
}
```

**Comportamiento:** Marca `isActive: false` (no elimina de BD)

**Rol requerido:** `admin`

---

### 🏛️ Universidades

#### Listar Universidades (Público)
```graphql
query Universities {
  universities {
    id
    name
    location
    createdAt
    updatedAt
  }
}
```

**Sin autenticación requerida**

---

#### Crear Universidad
```graphql
mutation CreateUniversity($createUniversityInput: CreateUniversityInput!) {
  createUniversity(createUniversityInput: $createUniversityInput) {
    id
    name
    location
    createdAt
  }
}
```

**Variables:**
```json
{
  "createUniversityInput": {
    "name": "Universidad del Valle",
    "location": "Cali, Colombia"
  }
}
```

**Validaciones:**
- ✅ Name: min 3 caracteres, max 200, único
- ✅ Location: min 3 caracteres, max 200

**Rol requerido:** `admin`

---

#### Actualizar Universidad
```graphql
mutation UpdateUniversity($id: ID!, $updateUniversityInput: UpdateUniversityInput!) {
  updateUniversity(id: $id, updateUniversityInput: $updateUniversityInput) {
    id
    name
    location
  }
}
```

**Rol requerido:** `admin`

---

#### Eliminar Universidad
```graphql
mutation RemoveUniversity($id: ID!) {
  removeUniversity(id: $id) {
    id
    name
  }
}
```

**Rol requerido:** `admin`

---

### 👨‍🏫 Profesores

#### Listar Profesores con Filtros (Público)
```graphql
query Professors($filterInput: FilterProfessorInput) {
  professors(filterInput: $filterInput) {
    id
    name
    department
    university {
      id
      name
      location
    }
    createdAt
  }
}
```

**Variables (opcionales):**
```json
{
  "filterInput": {
    "universityId": "uuid-universidad",
    "search": "García"
  }
}
```

**Filtros disponibles:**
- `universityId`: Filtrar por universidad específica
- `search`: Búsqueda en nombre del profesor (case-insensitive, usa LIKE)

---

#### Obtener Profesor por ID (Público)
```graphql
query Professor($id: ID!) {
  professor(id: $id) {
    id
    name
    department
    university {
      name
      location
    }
  }
}
```

---

#### Crear Profesor
```graphql
mutation CreateProfessor($createProfessorInput: CreateProfessorInput!) {
  createProfessor(createProfessorInput: $createProfessorInput) {
    id
    name
    department
    university {
      id
      name
    }
  }
}
```

**Variables:**
```json
{
  "createProfessorInput": {
    "name": "Dr. Juan Carlos Pérez",
    "department": "Ingeniería de Sistemas",
    "universityId": "uuid-universidad"
  }
}
```

**Validaciones:**
- ✅ Name: min 3 caracteres, max 100
- ✅ Department: min 3 caracteres, max 100
- ✅ UniversityId: UUID válido, universidad debe existir

**Rol requerido:** `admin`

---

#### Actualizar Profesor
```graphql
mutation UpdateProfessor($id: ID!, $updateProfessorInput: UpdateProfessorInput!) {
  updateProfessor(id: $id, updateProfessorInput: $updateProfessorInput) {
    id
    name
    department
  }
}
```

**Rol requerido:** `admin`

---

#### Eliminar Profesor
```graphql
mutation RemoveProfessor($id: ID!) {
  removeProfessor(id: $id) {
    id
    name
  }
}
```

**Rol requerido:** `admin`

---

### 💬 Comentarios

#### Listar Comentarios con Paginación (Público)
```graphql
query Comments($filterInput: FilterCommentInput) {
  comments(filterInput: $filterInput) {
    data {
      id
      content
      rating
      createdAt
      student {
        id
        fullName
      }
      professor {
        name
        department
        university {
          name
        }
      }
    }
    page
    limit
    total
  }
}
```

**Variables (todas opcionales):**
```json
{
  "filterInput": {
    "professorId": "uuid-profesor",
    "userId": "uuid-usuario",
    "search": "excelente",
    "page": 1,
    "limit": 20
  }
}
```

**Filtros:**
- `professorId`: Comentarios de un profesor específico
- `userId`: Comentarios de un usuario específico
- `search`: Búsqueda en contenido (case-insensitive)
- `page`: Número de página (default: 1)
- `limit`: Elementos por página (default: 20, max: 100)

---

#### Obtener Rating de Profesor (Público)
```graphql
query ProfessorRating($professorId: ID!) {
  professorRating(professorId: $professorId) {
    averageRating
    totalComments
  }
}
```

**Retorna:** Promedio de ratings y total de comentarios

---

#### Crear Comentario
```graphql
mutation CreateComment($createCommentInput: CreateCommentInput!) {
  createComment(createCommentInput: $createCommentInput) {
    id
    content
    rating
    createdAt
    professor {
      name
    }
    student {
      fullName
    }
  }
}
```

**Variables:**
```json
{
  "createCommentInput": {
    "content": "Excelente profesor, muy claro en sus explicaciones y siempre dispuesto a ayudar.",
    "rating": 5,
    "professorId": "uuid-profesor"
  }
}
```

**Validaciones exhaustivas:**
- ✅ Content: min 10 caracteres, max 500
- ✅ Rating: debe ser entero entre 1 y 5 (inclusivo)
- ✅ ProfessorId: UUID válido, profesor debe existir
- ✅ Usuario autenticado se asigna automáticamente
- ✅ No se permite comentar dos veces al mismo profesor (por usuario)

**Rol requerido:** `student` o `admin`

---

#### Actualizar Comentario
```graphql
mutation UpdateComment($id: ID!, $updateCommentInput: UpdateCommentInput!) {
  updateComment(id: $id, updateCommentInput: $updateCommentInput) {
    id
    content
    rating
    updatedAt
  }
}
```

**Validaciones:**
- ✅ Solo el autor o un admin puede actualizar
- ✅ Content: min 10 caracteres si se proporciona
- ✅ Rating: 1-5 si se proporciona

**Rol requerido:** `student` (propio) o `admin` (cualquiera)

---

#### Eliminar Comentario
```graphql
mutation RemoveComment($id: ID!) {
  removeComment(id: $id) {
    id
    content
  }
}
```

**Validaciones:**
- ✅ Solo el autor o un admin puede eliminar

**Rol requerido:** `student` (propio) o `admin` (cualquiera)

---

## 🧩 Fragments GraphQL

### ¿Por qué usar Fragments?

Los fragments permiten **reutilizar** estructuras de campos en múltiples queries/mutations, reduciendo duplicación y facilitando mantenimiento.

### Fragments Disponibles

#### 1. UserFields
```graphql
fragment UserFields on User {
  id
  email
  fullName
  roles
  isActive
  createdAt
  updatedAt
}

# Uso en query
query Me {
  me {
    ...UserFields
  }
}
```

---

#### 2. UniversityFields
```graphql
fragment UniversityFields on University {
  id
  name
  location
  createdAt
  updatedAt
}

query Universities {
  universities {
    ...UniversityFields
  }
}
```

---

#### 3. ProfessorFields
```graphql
fragment ProfessorFields on Professor {
  id
  name
  department
  createdAt
  updatedAt
}

# Con relación anidada
fragment ProfessorWithUniversity on Professor {
  ...ProfessorFields
  university {
    ...UniversityFields
  }
}

query Professors {
  professors {
    ...ProfessorWithUniversity
  }
}
```

---

#### 4. CommentFields
```graphql
fragment CommentFields on Comment {
  id
  content
  rating
  createdAt
  updatedAt
}

# Con relaciones completas
fragment CommentComplete on Comment {
  ...CommentFields
  student {
    id
    fullName
  }
  professor {
    id
    name
    department
  }
}

query Comments {
  comments {
    data {
      ...CommentComplete
    }
    page
    limit
    total
  }
}
```

---

#### 5. AuthResponse Fragment
```graphql
fragment AuthResponse on AuthReponse {
  token
  user {
    ...UserFields
  }
}

mutation Login($loginInput: LoginInput!) {
  login(loginInput: $loginInput) {
    ...AuthResponse
  }
}

mutation Signup($signupInput: SignupInput!) {
  signup(signupInput: $signupInput) {
    ...AuthResponse
  }
}
```

---

### Ejemplo Completo: Query Dashboard con Fragments

```graphql
# Definir todos los fragments
fragment UserBasic on User {
  id
  email
  fullName
  roles
}

fragment UniversityBasic on University {
  id
  name
  location
}

fragment ProfessorWithUniversity on Professor {
  id
  name
  department
  university {
    ...UniversityBasic
  }
}

fragment CommentWithRelations on Comment {
  id
  content
  rating
  createdAt
  student {
    ...UserBasic
  }
  professor {
    ...ProfessorWithUniversity
  }
}

# Query principal reutilizando fragments
query Dashboard {
  me {
    ...UserBasic
    createdAt
  }
  
  universities {
    ...UniversityBasic
  }
  
  professors(filterInput: { search: "García" }) {
    ...ProfessorWithUniversity
  }
  
  comments(filterInput: { page: 1, limit: 5 }) {
    data {
      ...CommentWithRelations
    }
    total
    page
  }
}
```

**Beneficios:**
- ✅ Reducción del 40% en código duplicado
- ✅ Consistencia garantizada en toda la aplicación
- ✅ Fácil mantenimiento (cambiar en un lugar)
- ✅ Composición de fragments (anidación)

---

## ✅ Validaciones Exhaustivas

### Validaciones Globales (ValidationPipe)

Configurado en `main.ts`:

```typescript
app.useGlobalPipes(
  new ValidationPipe({
    whitelist: true,              // Remueve propiedades no definidas en DTO
    forbidNonWhitelisted: true,   // Lanza error si hay propiedades extras
    transform: true,              // Transforma tipos automáticamente
  })
);
```

### Validaciones por Entidad

#### SignupInput / LoginInput
```typescript
export class SignupInput {
  @IsEmail({}, { message: 'El email debe ser válido' })
  @Transform(({ value }) => value.toLowerCase().trim())
  email: string;

  @IsString()
  @MinLength(8, { message: 'El password debe tener al menos 8 caracteres' })
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, {
    message: 'El password debe contener al menos una mayúscula, una minúscula y un número'
  })
  password: string;

  @IsString()
  @MinLength(3, { message: 'El nombre completo debe tener al menos 3 caracteres' })
  @MaxLength(100)
  fullName: string;
}
```

---

#### CreateUserInput
```typescript
export class CreateUserInput {
  @IsEmail()
  @Transform(({ value }) => value.toLowerCase().trim())
  email: string;

  @IsString()
  @MinLength(8)
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#])/, {
    message: 'Password debe contener mayúscula, minúscula, número y carácter especial'
  })
  password: string;

  @IsString()
  @MinLength(3)
  @MaxLength(100)
  fullName: string;

  @IsOptional()
  @IsArray()
  @IsIn(['admin', 'student'], { each: true })
  roles?: string[];
}
```

---

#### CreateUniversityInput
```typescript
export class CreateUniversityInput {
  @IsString()
  @MinLength(3, { message: 'El nombre debe tener al menos 3 caracteres' })
  @MaxLength(200)
  name: string;

  @IsString()
  @MinLength(3)
  @MaxLength(200)
  location: string;
}
```

---

#### CreateProfessorInput
```typescript
export class CreateProfessorInput {
  @IsString()
  @MinLength(3)
  @MaxLength(100)
  name: string;

  @IsString()
  @MinLength(3)
  @MaxLength(100)
  department: string;

  @IsUUID('4', { message: 'El ID de universidad debe ser un UUID válido' })
  universityId: string;
}
```

---

#### CreateCommentInput
```typescript
export class CreateCommentInput {
  @IsString()
  @MinLength(10, { message: 'El comentario debe tener al menos 10 caracteres' })
  @MaxLength(500, { message: 'El comentario no puede exceder 500 caracteres' })
  content: string;

  @IsInt({ message: 'El rating debe ser un número entero' })
  @Min(1, { message: 'El rating mínimo es 1' })
  @Max(5, { message: 'El rating máximo es 5' })
  rating: number;

  @IsUUID('4')
  professorId: string;
}
```

---

#### FilterCommentInput (Paginación)
```typescript
export class FilterCommentInput {
  @IsOptional()
  @IsUUID()
  professorId?: string;

  @IsOptional()
  @IsUUID()
  userId?: string;

  @IsOptional()
  @IsString()
  @MinLength(1)
  search?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Type(() => Number)
  page?: number = 1;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(100, { message: 'El límite máximo es 100' })
  @Type(() => Number)
  limit?: number = 20;
}
```

---

### Validaciones de Negocio

#### En Servicios
```typescript
// No permitir comentarios duplicados del mismo usuario al mismo profesor
const existingComment = await this.commentRepository.findOne({
  where: {
    student: { id: userId },
    professor: { id: professorId }
  }
});

if (existingComment) {
  throw new BadRequestException('Ya has comentado a este profesor');
}
```

```typescript
// Validar propiedad al actualizar/eliminar comentario
if (comment.student.id !== userId && !userRoles.includes('admin')) {
  throw new ForbiddenException('Solo puedes modificar tus propios comentarios');
}
```

---

## 🧪 Tests

### Ejecutar Tests

```bash
# Unit tests
npm run test

# Coverage
npm run test:cov

# Watch mode
npm run test:watch

# E2E tests
npm run test:e2e
```

### Cobertura Actual

```
Coverage: 81.95%
Total Tests: 424 passing
```

**Archivos de test:**
- `src/users/users.service.spec.ts` (69 tests)
- `src/users/users.resolver.spec.ts` (47 tests)
- `src/users/entities/user.entity.spec.ts` (95 tests)
- `src/auth/dto/auth-dto.spec.ts` (116 tests)
- `src/users/dto/users-dto.spec.ts` (72 tests)
- Y más...

---

## 📂 Estructura del Proyecto

```
src/
├── auth/                       # Módulo de autenticación
│   ├── decorators/             # @Auth, @CurrentUser
│   ├── dto/                    # SignupInput, LoginInput
│   ├── entities/               # AuthResponse
│   ├── guards/                 # JwtAuthGuard
│   ├── strategies/             # JwtStrategy
│   ├── auth.module.ts
│   ├── auth.resolver.ts
│   └── auth.service.ts
├── users/                      # Módulo de usuarios
│   ├── dto/                    # CreateUserInput, UpdateUserInput
│   ├── entities/               # User
│   ├── users.module.ts
│   ├── users.resolver.ts
│   └── users.service.ts
├── universities/               # Módulo de universidades
│   ├── dto/
│   ├── entities/
│   └── ...
├── professors/                 # Módulo de profesores
│   ├── dto/
│   ├── entities/
│   └── ...
├── comments/                   # Módulo de comentarios
│   ├── dto/
│   ├── entities/
│   └── ...
├── seed/                       # Módulo de seed
│   ├── seed.resolver.ts
│   └── seed.service.ts
├── common/                     # Módulos compartidos
│   └── valid-roles.enum.ts
├── app.module.ts               # Módulo raíz
├── main.ts                     # Bootstrap
└── schema.gql                  # Schema GraphQL auto-generado
```

---

## 🔧 Configuración GraphQL

En `app.module.ts`:

```typescript
GraphQLModule.forRoot<ApolloDriverConfig>({
  driver: ApolloDriver,
  autoSchemaFile: join(process.cwd(), 'src/schema.gql'),
  playground: true,
  context: ({ req }) => ({ req }),
})
```

**Características:**
- ✅ Schema auto-generado en `src/schema.gql`
- ✅ GraphQL Playground habilitado (desarrollo)
- ✅ Context con request para autenticación
- ✅ Decoradores de NestJS + TypeGraphQL

---

## 📚 Recursos Adicionales

### Colección de Postman
Importa `postman_collection.json` para probar todos los endpoints:
- 40+ requests organizados
- Variables automáticas
- Test scripts incluidos
- Ejemplos con fragments

### Documentación Complementaria
- **[POSTMAN_GUIDE.md](./POSTMAN_GUIDE.md)** - Guía paso a paso
- **[GRAPHQL_EXAMPLES.md](./GRAPHQL_EXAMPLES.md)** - Ejemplos avanzados
- **[DOCUMENTACION_RESUMEN.md](./DOCUMENTACION_RESUMEN.md)** - Overview completo

---

## 🤝 Contribuir

1. Fork el proyecto
2. Crea una rama (`git checkout -b feature/amazing-feature`)
3. Commit cambios (`git commit -m 'Add amazing feature'`)
4. Push a la rama (`git push origin feature/amazing-feature`)
5. Abre un Pull Request

---

## 📄 Licencia

Este proyecto es de código abierto bajo licencia MIT.

---

## 👨‍💻 Autor

**OscarMURA**
- GitHub: [@OscarMURA](https://github.com/OscarMURA)
- Repository: [qualifica-o-seu-professor-graphql](https://github.com/OscarMURA/qualifica-o-seu-professor-graphql)

---

## 🙏 Agradecimientos

- NestJS Team
- GraphQL Community
- TypeORM Contributors

---

**¿Preguntas?** Abre un issue en el repositorio o consulta la documentación en los archivos .md incluidos.
