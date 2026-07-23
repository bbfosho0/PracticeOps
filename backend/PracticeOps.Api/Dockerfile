FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src
COPY backend/PracticeOps.Api/PracticeOps.Api.csproj backend/PracticeOps.Api/
RUN dotnet restore backend/PracticeOps.Api/PracticeOps.Api.csproj
COPY backend/PracticeOps.Api backend/PracticeOps.Api
RUN dotnet publish backend/PracticeOps.Api/PracticeOps.Api.csproj -c Release -o /app/publish --no-restore

FROM mcr.microsoft.com/dotnet/aspnet:8.0
WORKDIR /app
COPY --from=build /app/publish .
EXPOSE 8080
ENTRYPOINT ["dotnet", "PracticeOps.Api.dll"]
