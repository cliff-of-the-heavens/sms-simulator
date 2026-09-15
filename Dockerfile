FROM node:20-alpine AS frontend-build
WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm install
COPY frontend/ ./
RUN npm run build

FROM maven:3.9-eclipse-temurin-21 AS backend-build
WORKDIR /app
COPY backend/pom.xml ./
RUN mvn -q -DskipTests dependency:go-offline
COPY backend/src ./src
COPY --from=frontend-build /app/frontend/dist ./src/main/resources/static
RUN mvn -q clean package -DskipTests

FROM eclipse-temurin:21-jre
WORKDIR /app
RUN mkdir -p /data
COPY --from=backend-build /app/target/sms-simulator-1.0.0.jar app.jar
EXPOSE 8080
ENTRYPOINT ["java", "-jar", "app.jar"]
