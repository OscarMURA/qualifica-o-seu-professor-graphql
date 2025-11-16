
## 📦 Configuración de Postman para GraphQL

### Variables de entorno en Postman:
```
graphDomain = http://localhost:9090
```

### Headers para todas las requests:
```
Content-Type: application/json
```

### Para requests autenticadas, agregar:
```
Authorization: Bearer {{token}}
```

### Script automático para todas las requests (Opcional)
En la Colección → Edit → Pestaña "Pre-request Script":
```javascript
// Automatically add Authorization header if token exists
if (pm.collectionVariables.get("token")) {
    pm.request.headers.add({
        key: 'Authorization',
        value: 'Bearer ' + pm.collectionVariables.get("token")
    });
}
```

---

## 🔐 1. AUTENTICACIÓN

### 1.1 Signup (Registrar nuevo estudiante)
**POST** `{{graphDomain}}/graphql`

**Body (GraphQL)**:
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
      createdAt
    }
  }
}
```

**GraphQL Variables**:
```json
{
  "signupInput": {
    "email": "student1@example.com",
    "password": "password123",
    "fullName": "Student One"
  }
}
```

---

### 1.2 Login
**POST** `{{graphDomain}}/graphql`

**Body (GraphQL)**:
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

**GraphQL Variables**:
```json
{
  "loginInput": {
    "email": "admin@example.com",
    "password": "password123"
  }
}
```

**Nota**: Guarda el `token` en una variable de Postman para usarlo en las siguientes requests.

**Script para guardar el token automáticamente (Pestaña "Tests")**:
```javascript
// Parse the JSON response
var jsonData = pm.response.json();

// Check if login was successful and token exists
if (jsonData.data && jsonData.data.login && jsonData.data.login.token) {
    // Save the token to a collection variable
    pm.collectionVariables.set("token", jsonData.data.login.token);
    
    // Optional: Save user info
    pm.collectionVariables.set("userId", jsonData.data.login.user.id);
    pm.collectionVariables.set("userEmail", jsonData.data.login.user.email);
    
    // Log success message
    console.log("✅ Token saved successfully!");
    console.log("Token:", jsonData.data.login.token);
} else {
    console.log("❌ No token found in response");
}
```

---

### 1.3 Me (Obtener perfil actual)
**POST** `{{graphDomain}}/graphql`
**Requiere**: Authorization Bearer Token

**Body (GraphQL)**:
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

**GraphQL Variables**: (No requiere)

---

## 👥 2. USUARIOS (Solo Admin)

### 2.1 Crear Usuario
**POST** `{{graphDomain}}/graphql`
**Requiere**: Admin Token

**Body (GraphQL)**:
```graphql
mutation CreateUser($createUserInput: CreateUserInput!) {
  createUser(createUserInput: $createUserInput) {
    id
    email
    fullName
    roles
    isActive
    createdAt
  }
}
```

**GraphQL Variables (Crear Student - por defecto)**:
```json
{
  "createUserInput": {
    "email": "newstudent@example.com",
    "password": "password123",
    "fullName": "New Student"
  }
}
```

**GraphQL Variables (Crear Admin)**:
```json
{
  "createUserInput": {
    "email": "admin2@example.com",
    "password": "password123",
    "fullName": "Second Admin",
    "roles": ["admin"]
  }
}
```

**Nota**: 
- Si NO especificas `roles`, se crea como **student** (por defecto)
- Para crear un **admin**, debes incluir `"roles": ["admin"]` en el input

**Script para guardar el ID automáticamente (Pestaña "Tests")**:
```javascript
// Parse the JSON response
var jsonData = pm.response.json();

// Check if user was created successfully
if (jsonData.data && jsonData.data.createUser) {
    var createdUser = jsonData.data.createUser;
    
    // Save user info to collection variables
    pm.collectionVariables.set("lastCreatedUserId", createdUser.id);
    pm.collectionVariables.set("lastCreatedUserEmail", createdUser.email);
    pm.collectionVariables.set("lastCreatedUserName", createdUser.fullName);
    
    // Log success message
    console.log("✅ User created successfully!");
    console.log("User ID:", createdUser.id);
    console.log("Email:", createdUser.email);
    console.log("Full Name:", createdUser.fullName);
    console.log("Roles:", createdUser.roles);
} else {
    console.log("❌ No user data found in response");
}
```

---

### 2.2 Listar Todos los Usuarios
**POST** `{{graphDomain}}/graphql`
**Requiere**: Admin Token

**Body (GraphQL)**:
```graphql
query Users {
  users {
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

**GraphQL Variables**: (No requiere)

---

### 2.3 Obtener Usuario por ID
**POST** `{{graphDomain}}/graphql`
**Requiere**: Admin Token

**Body (GraphQL)**:
```graphql
query User($id: ID!) {
  user(id: $id) {
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

**GraphQL Variables**:
```json
{
  "id": "{{lastCreatedUserId}}"
}
```

**Nota**: Usa `{{lastCreatedUserId}}` para consultar el último usuario creado

---

### 2.4 Actualizar Usuario
**POST** `{{graphDomain}}/graphql`
**Requiere**: Admin Token

**Body (GraphQL)**:
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

**GraphQL Variables**:
```json
{
  "id": "{{lastCreatedUserId}}",
  "updateUserInput": {
    "fullName": "Updated Name",
    "email": "updated@example.com"
  }
}
```

**Nota**: Usa `{{lastCreatedUserId}}` para actualizar el último usuario creado

---

### 2.5 Eliminar Usuario
**POST** `{{graphDomain}}/graphql`
**Requiere**: Admin Token

**Body (GraphQL)**:
```graphql
mutation RemoveUser($id: ID!) {
  removeUser(id: $id) {
    id
    email
    fullName
  }
}
```

**GraphQL Variables**:
```json
{
  "id": "{{lastCreatedUserId}}"
}
```

**Nota**: Usa `{{lastCreatedUserId}}` para eliminar el último usuario creado

---

## 🏫 3. UNIVERSIDADES

### 3.1 Listar Universidades (Público)
**POST** `{{graphDomain}}/graphql`

**Body (GraphQL)**:
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

**GraphQL Variables**: (No requiere)

---

### 3.2 Obtener Universidad por ID (Público)
**POST** `{{graphDomain}}/graphql`

**Body (GraphQL)**:
```graphql
query University($id: ID!) {
  university(id: $id) {
    id
    name
    location
    createdAt
    updatedAt
  }
}
```

**GraphQL Variables**:
```json
{
  "id": "{{lastCreatedUniversityId}}"
}
```

**Nota**: Usa `{{lastCreatedUniversityId}}` para consultar la última universidad creada

---

### 📝 3.3. Create University (Admin)
**POST** `{{graphDomain}}/graphql`
**Requiere**: Admin Token

**Body (GraphQL)**:
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

**GraphQL Variables**:
```json
{
  "createUniversityInput": {
    "name": "Universidad de Ejemplo"
  }
}
```

**Tests (JavaScript)**: Agrega este script en la pestaña "Tests" para guardar el ID de la universidad creada:
```javascript
// Guardar el ID de la universidad creada
const response = pm.response.json();
if (response.data && response.data.createUniversity) {
    const createdUniversity = response.data.createUniversity;
    pm.collectionVariables.set("lastCreatedUniversityId", createdUniversity.id);
    pm.collectionVariables.set("lastCreatedUniversityName", createdUniversity.name);
    console.log("✅ Universidad creada y guardada:");
    console.log("   - ID:", createdUniversity.id);
    console.log("   - Nombre:", createdUniversity.name);
} else {
    console.log("❌ Error al crear universidad");
}
```

---

### 3.4 Actualizar Universidad (Admin)
**POST** `{{graphDomain}}/graphql`
**Requiere**: Admin Token

**Body (GraphQL)**:
```graphql
mutation UpdateUniversity($id: ID!, $updateUniversityInput: UpdateUniversityInput!) {
  updateUniversity(id: $id, updateUniversityInput: $updateUniversityInput) {
    id
    name
    location
    updatedAt
  }
}
```

**GraphQL Variables**:
```json
{
  "id": "{{lastCreatedUniversityId}}",
  "updateUniversityInput": {
    "name": "Updated University Name",
    "location": "Updated Location"
  }
}
```

**Nota**: Usa `{{lastCreatedUniversityId}}` para actualizar la última universidad creada

---

### 3.5 Eliminar Universidad (Admin)
**POST** `{{graphDomain}}/graphql`
**Requiere**: Admin Token

**Body (GraphQL)**:
```graphql
mutation RemoveUniversity($id: ID!) {
  removeUniversity(id: $id) {
    id
    name
  }
}
```

**GraphQL Variables**:
```json
{
  "id": "{{lastCreatedUniversityId}}"
}
```

**Nota**: Usa `{{lastCreatedUniversityId}}` para eliminar la última universidad creada

---

## 👨‍🏫 4. PROFESORES

### 4.1 Listar Profesores (Público)
**POST** `{{graphDomain}}/graphql`

**Body (GraphQL)**:
```graphql
query Professors {
  professors {
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

**GraphQL Variables**: (No requiere)

---

### 4.2 Listar Profesores con Filtros (Público)
**POST** `{{graphDomain}}/graphql`

**Body (GraphQL)**:
```graphql
query ProfessorsFiltered($filterInput: FilterProfessorInput) {
  professors(filterInput: $filterInput) {
    id
    name
    department
    university {
      id
      name
      location
    }
  }
}
```

**GraphQL Variables (Filtrar por Universidad)**:
```json
{
  "filterInput": {
    "universityId": "uuid-de-universidad"
  }
}
```

**GraphQL Variables (Buscar por texto)**:
```json
{
  "filterInput": {
    "search": "Computer Science"
  }
}
```

**GraphQL Variables (Ambos filtros)**:
```json
{
  "filterInput": {
    "universityId": "{{lastCreatedUniversityId}}",
    "search": "Math"
  }
}
```

**Nota**: Puedes usar `{{lastCreatedUniversityId}}` para filtrar por la última universidad creada

---

### 4.3 Obtener Profesor por ID (Público)
**POST** `{{graphDomain}}/graphql`

**Body (GraphQL)**:
```graphql
query Professor($id: ID!) {
  professor(id: $id) {
    id
    name
    department
    university {
      id
      name
      location
    }
    createdAt
    updatedAt
  }
}
```

**GraphQL Variables**:
```json
{
  "id": "{{lastCreatedProfessorId}}"
}
```

**Nota**: Usa `{{lastCreatedProfessorId}}` para consultar el último profesor creado

---

### 4.4 Crear Profesor (Admin)
**POST** `{{graphDomain}}/graphql`
**Requiere**: Admin Token

**Body (GraphQL)**:
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
    createdAt
  }
}
```

**GraphQL Variables**:
```json
{
  "createProfessorInput": {
    "name": "Dr. John Smith",
    "department": "Computer Science",
    "universityId": "{{lastCreatedUniversityId}}"
  }
}
```

**Nota**: Usa `{{lastCreatedUniversityId}}` para asociar el profesor a la última universidad creada

**Tests (JavaScript)**: Agrega este script en la pestaña "Tests" para guardar el ID del profesor creado:
```javascript
// Guardar el ID del profesor creado
const response = pm.response.json();
if (response.data && response.data.createProfessor) {
    const createdProfessor = response.data.createProfessor;
    pm.collectionVariables.set("lastCreatedProfessorId", createdProfessor.id);
    pm.collectionVariables.set("lastCreatedProfessorName", createdProfessor.name);
    pm.collectionVariables.set("lastCreatedProfessorDepartment", createdProfessor.department);
    console.log("✅ Profesor creado y guardado:");
    console.log("   - ID:", createdProfessor.id);
    console.log("   - Nombre:", createdProfessor.name);
    console.log("   - Departamento:", createdProfessor.department);
} else {
    console.log("❌ Error al crear profesor");
}
```

---

### 4.5 Actualizar Profesor (Admin)
**POST** `{{graphDomain}}/graphql`
**Requiere**: Admin Token

**Body (GraphQL)**:
```graphql
mutation UpdateProfessor($id: ID!, $updateProfessorInput: UpdateProfessorInput!) {
  updateProfessor(id: $id, updateProfessorInput: $updateProfessorInput) {
    id
    name
    department
    university {
      name
    }
  }
}
```

**GraphQL Variables**:
```json
{
  "id": "{{lastCreatedProfessorId}}",
  "updateProfessorInput": {
    "name": "Dr. Updated Name",
    "department": "Mathematics"
  }
}
```

**Nota**: Usa `{{lastCreatedProfessorId}}` para actualizar el último profesor creado

---

### 4.6 Eliminar Profesor (Admin)
**POST** `{{graphDomain}}/graphql`
**Requiere**: Admin Token

**Body (GraphQL)**:
```graphql
mutation RemoveProfessor($id: ID!) {
  removeProfessor(id: $id) {
    id
    name
  }
}
```

**GraphQL Variables**:
```json
{
  "id": "{{lastCreatedProfessorId}}"
}
```

**Nota**: Usa `{{lastCreatedProfessorId}}` para eliminar el último profesor creado

---

## 💬 5. COMENTARIOS

### 5.1 Listar Comentarios (Público)
**POST** `{{graphDomain}}/graphql`

**Body (GraphQL)**:
```graphql
query Comments {
  comments {
    data {
      id
      content
      rating
      professor {
        id
        name
        department
      }
      student {
        id
        fullName
      }
      createdAt
    }
    page
    limit
    total
  }
}
```

**GraphQL Variables**: (No requiere)

---

### 5.2 Listar Comentarios con Filtros y Paginación (Público)
**POST** `{{graphDomain}}/graphql`

**Body (GraphQL)**:
```graphql
query CommentsFiltered($filterInput: FilterCommentInput) {
  comments(filterInput: $filterInput) {
    data {
      id
      content
      rating
      professor {
        name
        department
      }
      student {
        fullName
      }
      createdAt
    }
    page
    limit
    total
  }
}
```

**GraphQL Variables (Filtrar por Profesor)**:
```json
{
  "filterInput": {
    "professorId": "{{lastCreatedProfessorId}}",
    "page": 1,
    "limit": 10
  }
}
```

**Nota**: Usa `{{lastCreatedProfessorId}}` para filtrar comentarios del último profesor creado

**GraphQL Variables (Filtrar por Usuario)**:
```json
{
  "filterInput": {
    "userId": "{{lastCreatedUserId}}",
    "page": 1,
    "limit": 20
  }
}
```

**Nota**: Usa `{{lastCreatedUserId}}` para filtrar comentarios del último usuario creado

**GraphQL Variables (Buscar por texto)**:
```json
{
  "filterInput": {
    "search": "excellent",
    "page": 1,
    "limit": 20
  }
}
```

---

### 5.3 Obtener Comentario por ID (Público)
**POST** `{{graphDomain}}/graphql`

**Body (GraphQL)**:
```graphql
query Comment($id: ID!) {
  comment(id: $id) {
    id
    content
    rating
    professor {
      id
      name
      department
      university {
        name
      }
    }
    student {
      id
      fullName
      email
    }
    createdAt
    updatedAt
  }
}
```

**GraphQL Variables**:
```json
{
  "id": "{{lastCreatedCommentId}}"
}
```

**Nota**: Usa `{{lastCreatedCommentId}}` para consultar el último comentario creado

---

### 5.4 Crear Comentario (Requiere autenticación)
**POST** `{{graphDomain}}/graphql`
**Requiere**: Student o Admin Token

**Body (GraphQL)**:
```graphql
mutation CreateComment($createCommentInput: CreateCommentInput!) {
  createComment(createCommentInput: $createCommentInput) {
    id
    content
    rating
    professor {
      id
      name
    }
    student {
      fullName
    }
    createdAt
  }
}
```

**GraphQL Variables**:
```json
{
  "createCommentInput": {
    "content": "Excelente profesor, explica muy bien los conceptos!",
    "rating": 5,
    "professorId": "{{lastCreatedProfessorId}}"
  }
}
```

**Nota**: Usa `{{lastCreatedProfessorId}}` para asociar el comentario al último profesor creado

**Tests (JavaScript)**: Agrega este script en la pestaña "Tests" para guardar el ID del comentario creado:
```javascript
// Guardar el ID del comentario creado
const response = pm.response.json();
if (response.data && response.data.createComment) {
    const createdComment = response.data.createComment;
    pm.collectionVariables.set("lastCreatedCommentId", createdComment.id);
    pm.collectionVariables.set("lastCreatedCommentRating", createdComment.rating);
    console.log("✅ Comentario creado y guardado:");
    console.log("   - ID:", createdComment.id);
    console.log("   - Rating:", createdComment.rating);
    console.log("   - Contenido:", createdComment.content.substring(0, 50) + "...");
} else {
    console.log("❌ Error al crear comentario");
}
```

---

### 5.5 Actualizar Comentario (Dueño o Admin)
**POST** `{{graphDomain}}/graphql`
**Requiere**: Token del dueño o Admin

**Body (GraphQL)**:
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

**GraphQL Variables**:
```json
{
  "id": "{{lastCreatedCommentId}}",
  "updateCommentInput": {
    "content": "Updated comment text",
    "rating": 4
  }
}
```

**Nota**: Usa `{{lastCreatedCommentId}}` para actualizar el último comentario creado

---

### 5.6 Eliminar Comentario (Dueño o Admin)
**POST** `{{graphDomain}}/graphql`
**Requiere**: Token del dueño o Admin

**Body (GraphQL)**:
```graphql
mutation RemoveComment($id: ID!) {
  removeComment(id: $id) {
    id
    content
  }
}
```

**GraphQL Variables**:
```json
{
  "id": "{{lastCreatedCommentId}}"
}
```

**Nota**: Usa `{{lastCreatedCommentId}}` para eliminar el último comentario creado

---

### 5.7 Obtener Rating Promedio de Profesor (Público)
**POST** `{{graphDomain}}/graphql`

**Body (GraphQL)**:
```graphql
query ProfessorRating($professorId: ID!) {
  professorRating(professorId: $professorId) {
    averageRating
    totalComments
  }
}
```

**GraphQL Variables**:
```json
{
  "professorId": "{{lastCreatedProfessorId}}"
}
```

**Nota**: Usa `{{lastCreatedProfessorId}}` para obtener el rating del último profesor creado

---

## 🌱 6. SEED (Datos de Prueba)

### 6.1 Ejecutar Seed (Público)
**POST** `{{graphDomain}}/graphql`

**Body (GraphQL)**:
```graphql
mutation ExecuteSeed {
  executeSeed {
    message
    admin {
      id
      email
    }
    universities
    professors
    students
    comments
  }
}
```

**GraphQL Variables**: (No requiere)

---

### 6.2 Ejecutar Unseed (Público)
**POST** `{{graphDomain}}/graphql`

**Body (GraphQL)**:
```graphql
mutation ExecuteUnseed {
  executeUnseed {
    message
  }
}
```

**GraphQL Variables**: (No requiere)

---

## 📝 Flujo de Prueba Recomendado:

1. **Ejecutar Seed** para poblar la BD con datos de prueba
2. **Login como Admin** (`admin@example.com` / `password123`)
3. **Guardar el token** en variable de Postman (automático con script)
4. **Probar queries públicas** (Universities, Professors, Comments)
5. **Probar operaciones de Admin** (Crear, Actualizar, Eliminar)
6. **Signup como Student**
7. **Crear comentarios** como estudiante
8. **Verificar rating de profesores**

---

## 📋 Variables de Colección Disponibles

Estas variables se guardan automáticamente cuando creas entidades usando los scripts de Tests:

### 🔐 Autenticación
- `{{authToken}}` - Token JWT del usuario autenticado (se guarda al hacer Login)
- `{{currentUserEmail}}` - Email del usuario actual
- `{{currentUserName}}` - Nombre completo del usuario actual

### 👤 Usuarios
- `{{lastCreatedUserId}}` - ID del último usuario creado
- `{{lastCreatedUserEmail}}` - Email del último usuario creado
- `{{lastCreatedUserName}}` - Nombre del último usuario creado

### 🏫 Universidades
- `{{lastCreatedUniversityId}}` - ID de la última universidad creada
- `{{lastCreatedUniversityName}}` - Nombre de la última universidad creada

### 👨‍🏫 Profesores
- `{{lastCreatedProfessorId}}` - ID del último profesor creado
- `{{lastCreatedProfessorName}}` - Nombre del último profesor creado
- `{{lastCreatedProfessorDepartment}}` - Departamento del último profesor creado

### 💬 Comentarios
- `{{lastCreatedCommentId}}` - ID del último comentario creado
- `{{lastCreatedCommentRating}}` - Rating del último comentario creado

### 🌐 Configuración
- `{{graphDomain}}` - URL base del servidor GraphQL (ej: `http://localhost:9090`)

**Nota**: Para usar estas variables en tus requests, simplemente escríbelas entre dobles llaves `{{nombreVariable}}` en cualquier parte de la petición (URL, Headers, GraphQL Variables, etc.)

---

## 💡 Consejos de Uso

1. **Autorización Automática**: El script de colección agrega automáticamente el header `Authorization: Bearer {{authToken}}` si la variable está definida

2. **Workflow Recomendado**: 
   - Crea una entidad (Universidad/Profesor/Comentario)
   - El script guarda automáticamente su ID
   - Usa ese ID en operaciones posteriores (Update/Delete) sin copiar/pegar manualmente

3. **Verificar Variables**: 
   - En Postman, ve a la pestaña "Variables" de la colección para ver todas las variables guardadas
   - También puedes verlas en la consola de Postman después de cada request con script

4. **Limpiar Variables**: 
   - Si necesitas empezar de nuevo, puedes ejecutar `executeUnseed` para limpiar la base de datos
   - O manualmente borrar las variables desde la pestaña "Variables" de la colección

---
