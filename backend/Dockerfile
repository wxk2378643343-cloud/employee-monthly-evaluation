# syntax=docker/dockerfile:1.7
FROM maven:3.9.9-eclipse-temurin-8 AS build
WORKDIR /app

COPY pom.xml ./
COPY src ./src
RUN mvn -B -DskipTests clean package

FROM eclipse-temurin:8-jre
WORKDIR /app
COPY --from=build /app/target/eval-backend-1.0.0.jar app.jar
EXPOSE 8080
ENTRYPOINT ["java","-jar","/app/app.jar"]
