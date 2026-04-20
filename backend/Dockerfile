FROM maven:3.9-eclipse-temurin-21-alpine AS build
WORKDIR /app

COPY pom.xml .
RUN mvn dependency:go-offline -B

COPY src ./src
RUN mvn package -DskipTests -B

FROM eclipse-temurin:21-jre-alpine
WORKDIR /app
COPY --from=build /app/target/*.jar app.jar
EXPOSE 8080

# ✅ KEY FIX: Use Render's dynamic $PORT, fallback to 8080 for Docker local
ENTRYPOINT ["sh", "-c", "java -jar app.jar --server.port=${PORT:-8080}"]