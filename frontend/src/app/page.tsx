export default function HomePage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="text-center">
        <h1 className="text-4xl font-bold tracking-tight text-foreground sm:text-6xl">
          Asistente IA para Actividades Juveniles
        </h1>
        <p className="mt-6 text-lg leading-8 text-muted-foreground">
          Genera actividades, dinámicas y programaciones personalizadas para tus grupos de jóvenes
          utilizando inteligencia artificial avanzada.
        </p>
        
        <div className="mt-10 flex items-center justify-center gap-x-6">
          <a
            href="/dashboard"
            className="rounded-md bg-primary px-3.5 py-2.5 text-sm font-semibold text-primary-foreground shadow-sm hover:bg-primary/90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
          >
            Comenzar ahora
          </a>
          <a href="/acerca" className="text-sm font-semibold leading-6 text-foreground">
            Conocer más <span aria-hidden="true">→</span>
          </a>
        </div>
      </div>
      
      <div className="mx-auto mt-16 max-w-2xl sm:mt-20 lg:mt-24 lg:max-w-4xl">
        <dl className="grid max-w-xl grid-cols-1 gap-x-8 gap-y-10 lg:max-w-none lg:grid-cols-2 lg:gap-y-16">
          <div className="relative pl-16">
            <dt className="text-base font-semibold leading-7 text-foreground">
              <div className="absolute left-0 top-0 flex h-10 w-10 items-center justify-center rounded-lg bg-primary">
                🎯
              </div>
              Actividades Personalizadas
            </dt>
            <dd className="mt-2 text-base leading-7 text-muted-foreground">
              Genera actividades adaptadas a la edad, tamaño del grupo y objetivos específicos de tu programación.
            </dd>
          </div>
          
          <div className="relative pl-16">
            <dt className="text-base font-semibold leading-7 text-foreground">
              <div className="absolute left-0 top-0 flex h-10 w-10 items-center justify-center rounded-lg bg-primary">
                🧠
              </div>
              Inteligencia Artificial
            </dt>
            <dd className="mt-2 text-base leading-7 text-muted-foreground">
              Utiliza IA entrenada específicamente en metodologías y dinámicas juveniles probadas.
            </dd>
          </div>
          
          <div className="relative pl-16">
            <dt className="text-base font-semibold leading-7 text-foreground">
              <div className="absolute left-0 top-0 flex h-10 w-10 items-center justify-center rounded-lg bg-primary">
                💾
              </div>
              Biblioteca Personal
            </dt>
            <dd className="mt-2 text-base leading-7 text-muted-foreground">
              Guarda, organiza y reutiliza tus actividades favoritas para futuras programaciones.
            </dd>
          </div>
          
          <div className="relative pl-16">
            <dt className="text-base font-semibold leading-7 text-foreground">
              <div className="absolute left-0 top-0 flex h-10 w-10 items-center justify-center rounded-lg bg-primary">
                👥
              </div>
              Para Todos los Grupos
            </dt>
            <dd className="mt-2 text-base leading-7 text-muted-foreground">
              Desde pre-adolescentes hasta jóvenes adultos, encuentra actividades para cada etapa.
            </dd>
          </div>
        </dl>
      </div>
    </div>
  )
}