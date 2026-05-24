import { type RouteConfig, index, route, layout } from "@react-router/dev/routes";

export default [
    index("routes/home.tsx"),

    route("auth/login", "routes/auth.login.tsx"),
    route("auth/register", "routes/auth.register.tsx"),

    layout("routes/app.tsx", [
        route("app",            "routes/app._index.tsx"),
        route('app/training',   'routes/app.training.tsx'),
        // route("app/training/:id", "routes/app.training.$id.tsx"),
        route("app/routines",   "routes/app.routines.tsx"),
        // route("app/routines/:id", "routes/app.routines.$id.tsx"),
        route("app/progress",   "routes/app.progress.tsx"),
        route("app/profile",    "routes/app.profile.tsx"),
    ]),
    
] satisfies RouteConfig;
