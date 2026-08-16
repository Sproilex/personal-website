import {
  tsParticles,
  getPosition,
  type Container,
  type IDelta,
  type Particle,
} from "@tsparticles/engine";

import {
  ExternalInteractorBase,
  loadInteractivityPlugin,
  type IInteractivityData,
} from "@tsparticles/plugin-interactivity";

import { loadFull } from "tsparticles";

/**
 * ============================================================
 * PROJECTS
 * ============================================================
 *
 * x / y están expresados en porcentaje del canvas.
 *
 * Estos datos pertenecen a TU aplicación, no a tsParticles.
 */
const projects = [
  {
    id: "project-01",
    title: "Project Alpha",

    x: 72,
    y: 24,

    color: "#a78bfa",
    size: 9,
  },

  {
    id: "project-02",
    title: "Project Nebula",

    x: 84,
    y: 62,

    color: "#818cf8",
    size: 11,
  },

  {
    id: "project-03",
    title: "Project Orbit",

    x: 58,
    y: 78,

    color: "#c4b5fd",
    size: 8,
  },

  {
    id: "project-04",
    title: "Project Nova",

    x: 36,
    y: 34,

    color: "#93c5fd",
    size: 10,
  },
];

/**
 * ============================================================
 * FIND PROJECT AT POINT (compartido)
 * ============================================================
 *
 * Misma lógica que usa el repulse para saber si el cursor está
 * sobre un proyecto — la reutilizamos también para el tooltip y
 * el click, así solo hay un sitio donde ajustar el radio de
 * detección.
 */
const projectHitRadius = 35;

const findProjectAtPoint = (
  pointer: { x: number; y: number },
  canvasSize: { width: number; height: number },
): (typeof projects)[number] | undefined => {
  let closestProject: (typeof projects)[number] | undefined;
  let closestDistance = Infinity;

  for (const project of projects) {
    const position = {
      x: (project.x / 100) * canvasSize.width,
      y: (project.y / 100) * canvasSize.height,
    };

    const dx = pointer.x - position.x;
    const dy = pointer.y - position.y;
    const distance = Math.sqrt(dx * dx + dy * dy);

    if (distance <= projectHitRadius && distance < closestDistance) {
      closestProject = project;
      closestDistance = distance;
    }
  }

  return closestProject;
};

/**
 * ============================================================
 * PROJECT REPULSE
 * ============================================================
 *
 * Flujo:
 *
 * cursor
 *   ↓
 * ¿está sobre un proyecto?
 *   ↓
 * proyecto encontrado
 *   ↓
 * buscar partículas alrededor
 *   ↓
 * aplicar fuerza radial
 *
 * No utilizamos projectId dentro de particle.options.
 */
class ProjectRepulseInteractor extends ExternalInteractorBase {
  private readonly repulseRadius = 170;

  /**
   * Cuánto empujamos, en PÍXELES REALES por frame (en el centro
   * del radio). Ver la explicación de más abajo sobre por qué
   * esto ya no se expresa como "velocidad" a secas.
   */
  private readonly pushPixelsPerFrame = 3;

  /**
   * Tope de velocidad EFECTIVA (píxeles reales/frame) que puede
   * alcanzar cualquier partícula empujada, sea cual sea su
   * velocidad base.
   */
  private readonly maxEffectivePixelsPerFrame = 9;

  clear(): void {}

  init(): void {}

  reset(): void {}

  isEnabled(interactivityData: IInteractivityData): boolean {
    return Boolean(interactivityData.mouse.position);
  }

  interact(
    interactivityData: IInteractivityData,
    delta: IDelta,
  ): void {
    const pointer = interactivityData.mouse.position;

    if (!pointer) {
      return;
    }

    const container = this.container;

    /**
     * Convertimos los proyectos definidos en porcentaje
     * a coordenadas reales del canvas.
     */
    const hoveredProject = findProjectAtPoint(
      pointer,
      container.canvas.size,
    );

    /**
     * El cursor no está sobre ningún proyecto.
     */
    if (!hoveredProject) {
      return;
    }

    /**
     * Coordenada real del proyecto.
     */
    const projectPosition = {
      x:
        (hoveredProject.x / 100) *
        container.canvas.size.width,

      y:
        (hoveredProject.y / 100) *
        container.canvas.size.height,
    };

    /**
     * ============================================================
     * FIX PRINCIPAL
     * ============================================================
     *
     * `container.particles.quadTree` NO EXISTE en la versión actual
     * de @tsparticles/engine (verificado contra el código fuente
     * instalado: cero coincidencias de "quadTree" en todo el paquete).
     *
     * El motor usa un SpatialHashGrid expuesto como propiedad pública
     * `grid`, con el mismo método `queryCircle(position, radius)`.
     *
     * Llamar a `.queryCircle` sobre `undefined` lanzaba un TypeError
     * en cuanto el cursor pasaba sobre un proyecto, lo que podía
     * interrumpir el loop de interactividad/animación — de ahí el
     * comportamiento "a medias".
     */
    const affectedParticles =
      container.particles.grid.queryCircle(
        projectPosition,
        this.repulseRadius,
      );

    for (const particle of affectedParticles) {
      /**
       * No queremos empujar una manual particle de proyecto.
       *
       * Detectamos si la partícula está prácticamente
       * encima de alguna posición de proyecto.
       */
      if (this.isProjectParticle(particle)) {
        continue;
      }

      if (
        particle.destroyed ||
        particle.spawning
      ) {
        continue;
      }

      this.pushParticle(
        particle,
        projectPosition,
        delta,
      );
    }
  }

  /**
   * ==========================================================
   * DETECT PROJECT PARTICLES
   * ==========================================================
   *
   * Ahora que las estrellas de proyecto se añaden con
   * `group: "projects"` (ver addProjectParticles), podemos
   * identificarlas directamente por su grupo — mucho más fiable
   * que comparar distancias en píxeles contra la lista de
   * proyectos.
   */
  private isProjectParticle(particle: Particle): boolean {
    return particle.group === "projects";
  }

  /**
   * ==========================================================
   * PUSH PARTICLE
   * ==========================================================
   */
  private pushParticle(
    particle: Particle,
    center: { x: number; y: number },
    delta: IDelta,
  ): void {
    const dx =
      particle.position.x - center.x;

    const dy =
      particle.position.y - center.y;

    const distanceSquared =
      dx * dx + dy * dy;

    if (distanceSquared < 0.0001) {
      return;
    }

    const distance =
      Math.sqrt(distanceSquared);

    if (
      distance >= this.repulseRadius
    ) {
      return;
    }

    /**
     * 0 = centro
     * 1 = borde del radio
     */
    const normalizedDistance =
      distance / this.repulseRadius;

    /**
     * La fuerza es mucho mayor cerca del proyecto.
     *
     * IMPORTANTE: esto está en PÍXELES REALES por frame, no en
     * "unidades de velocidad" -- ver el porqué justo abajo.
     */
    const strength =
      Math.pow(
        1 - normalizedDistance,
        2,
      ) *
      this.pushPixelsPerFrame *
      delta.factor;

    /**
     * Vector normalizado desde el proyecto
     * hacia la partícula.
     */
    const nx = dx / distance;
    const ny = dy / distance;

    /**
     * ==========================================================
     * FIX DE FONDO: `particle.velocity` NO son píxeles/frame
     * ==========================================================
     *
     * Lo comprobé en el código fuente de @tsparticles/plugin-move:
     * cada frame, el motor mueve la partícula así:
     *
     *   position += velocity * moveSpeed
     *
     * `velocity` es basicamente un vector de DIRECCIÓN (longitud
     * ~1 en reposo), y `moveSpeed` (particle.retina.moveSpeed) es
     * quien de verdad determina cuánto se desplaza cada frame. Las
     * estrellas de fondo tienen moveSpeed ~0.03-0.18, los cometas
     * ~7-12 -- una diferencia de hasta 100x.
     *
     * Antes sumábamos directamente a `velocity` y limitábamos su
     * magnitud a un número fijo (o relativo a sí misma), sin tener
     * en cuenta `moveSpeed`. Eso hacía que el MISMO empujón fuera
     * casi imperceptible en una estrella lenta pero una sacudida
     * violenta en un cometa (velocity boosteada x moveSpeed alto =
     * desplazamiento real enorme) -- de ahí el "rebote" a toda
     * velocidad.
     *
     * Ahora expresamos el empujón en píxeles REALES deseados y lo
     * convertimos a las unidades internas de `velocity` dividiendo
     * por `moveSpeed`, y el tope también se aplica sobre el
     * desplazamiento real (velocity.length * moveSpeed), no sobre
     * `velocity.length` a secas. Así el empujón se siente igual de
     * fuerte en cualquier partícula, sea rápida o lenta.
     */
    const moveSpeed = particle.retina.moveSpeed || 1;

    particle.velocity.x += (nx * strength) / moveSpeed;
    particle.velocity.y += (ny * strength) / moveSpeed;

    const effectiveSpeed =
      particle.velocity.length * moveSpeed;

    if (effectiveSpeed > this.maxEffectivePixelsPerFrame) {
      particle.velocity.length =
        this.maxEffectivePixelsPerFrame / moveSpeed;
    }

    /**
     * ==========================================================
     * MARCAR PARA EL REGRESO (solo cometas)
     * ==========================================================
     *
     * `move.trail` (el que usan los emitters de cometas en este
     * archivo) NO es una propiedad real de tsParticles — lo
     * comprobé contra la clase `Move` del motor: no existe. Se
     * ignora en silencio, igual que pasaba con `density.area`.
     *
     * Así que para identificar "esto es un cometa" usamos otro
     * rasgo que sí es fiable en este archivo: los cometas son las
     * únicas partículas con `move.straight: true` (van en línea
     * recta, dirección fija) — las estrellas de fondo usan
     * `straight: false` + `random: true`, y las de proyecto no se
     * mueven en absoluto.
     */
    if (particle.options.move?.straight) {
      cometReturnTargets.set(particle, {
        x: center.x,
        y: center.y,
      });
    }
  }
}

/**
 * ============================================================
 * COMET RETURN (las estrellas fugaces vuelven a su estrella)
 * ============================================================
 *
 * Cuando una partícula con estela es empujada por
 * `ProjectRepulseInteractor`, queda registrada aquí junto con la
 * posición del proyecto que la empujó. Este updater, en cada
 * frame, tira suavemente de ella de vuelta hacia esa posición --
 * hasta que llega lo bastante cerca, momento en el que la
 * soltamos y sigue su camino con la velocidad que lleve en ese
 * instante.
 */
const cometReturnTargets = new WeakMap<
  Particle,
  { x: number; y: number }
>();

/**
 * ============================================================
 * DECAY DE VELOCIDAD EXTRA
 * ============================================================
 *
 * Cuando el repulse empuja una partícula, le añade velocidad
 * "extra" por encima de su ritmo natural. Antes esa velocidad se
 * quedaba ahí para siempre -- así que aunque el "regreso" la
 * guiara de vuelta a su sitio, seguía viajando igual de rápido y
 * se pasaba de largo una y otra vez (el efecto de rebote/pinball
 * que comentabas). Esta función reduce gradualmente ese exceso
 * de velocidad hacia el ritmo natural de la partícula
 * (`particle.initialVelocity`, su velocidad de nacimiento),
 * conservando la dirección -- solo frena, no redirige.
 */
const restoreSpeedRate = 0.035;

const decayExcessSpeed = (
  particle: Particle,
  delta: IDelta,
): void => {
  const naturalLength =
    particle.initialVelocity?.length || 1;
  const currentLength = particle.velocity.length;

  if (currentLength > naturalLength) {
    particle.velocity.length =
      currentLength +
      (naturalLength - currentLength) *
        restoreSpeedRate *
        delta.factor;
  }
};

class CometReturnUpdater {
  /**
   * En PÍXELES REALES por frame (por cada px de distancia que le
   * falta por recorrer) -- ver la explicación de `pushParticle`
   * sobre por qué esto ya no se expresa como "velocidad" a secas.
   */
  private readonly pullPixelsPerFrame = 0.00045;

  private readonly arriveDistance = 24;

  init(): void {}

  isEnabled(particle: Particle): boolean {
    return (
      cometReturnTargets.has(particle) &&
      !particle.destroyed
    );
  }

  update(particle: Particle, delta: IDelta): void {
    if (!this.isEnabled(particle)) {
      return;
    }

    /**
     * Disipamos el exceso de velocidad SIEMPRE que esta
     * partícula siga marcada, no solo mientras la guiamos de
     * vuelta -- así deja de "volar" en cuanto llega, en vez de
     * seguir a toda pastilla con la última dirección que tenía.
     */
    decayExcessSpeed(particle, delta);

    const target = cometReturnTargets.get(particle);

    if (!target) {
      return;
    }

    const dx = target.x - particle.position.x;
    const dy = target.y - particle.position.y;
    const distance = Math.sqrt(dx * dx + dy * dy);

    /**
     * Ya volvió lo bastante cerca: la soltamos y que siga su
     * camino normal (ya con la velocidad ya casi recuperada
     * gracias al decay de arriba).
     */
    if (distance <= this.arriveDistance) {
      cometReturnTargets.delete(particle);
      return;
    }

    const nx = dx / distance;
    const ny = dy / distance;
    const moveSpeed = particle.retina.moveSpeed || 1;

    particle.velocity.x +=
      (nx * this.pullPixelsPerFrame * distance * delta.factor) /
      moveSpeed;

    particle.velocity.y +=
      (ny * this.pullPixelsPerFrame * distance * delta.factor) /
      moveSpeed;
  }
}

const loadCometReturn = async () => {
  await tsParticles.pluginManager.register((engine) => {
    if (!engine.pluginManager.addParticleUpdater) {
      console.error(
        "[comet-return] addParticleUpdater no está disponible: " +
          "revisa la versión de @tsparticles/engine.",
      );
      return;
    }

    engine.pluginManager.addParticleUpdater(
      "comet-return",
      () => Promise.resolve(new CometReturnUpdater()),
    );
  });
};

/**
 * ============================================================
 * COMET TRAIL (estela real, SOLO para cometas)
 * ============================================================
 *
 * tsParticles trae una opción `trail` de nivel superior
 * (`@tsparticles/plugin-trail`), pero es GLOBAL: pinta todo el
 * canvas con un rectángulo semitransparente en vez de limpiarlo,
 * así que difuminaría también las estrellas de fondo. Como
 * quieres la estela SOLO en las estrellas fugaces, la hacemos a
 * mano: cada cierto tiempo, un cometa "suelta" un punto fantasma
 * en su posición actual, que se encoge y desvanece con
 * `opacity.animation` / `size.animation` y se autodestruye con
 * `life` (count: 1, duration corta) — nunca se acumulan.
 *
 * Van a su propio grupo "comet-trail" con density.enable:false,
 * por el mismo motivo que el grupo "projects": si no, `setDensity()`
 * podría purgarlos por sorpresa en un resize (ver el bug de las
 * estrellas de proyecto invisibles, más arriba en la conversación).
 */
const cometTrailTimers = new WeakMap<Particle, number>();

class CometTrailUpdater {
  /**
   * Cuanto más bajo, más densa/continua se ve la estela (más
   * puntos por segundo). Súbelo si notas que "gotea" en vez de
   * verse continua.
   */
  private readonly spawnIntervalMs = 22;

  /**
   * Cuánto tarda cada punto de la estela en desvanecerse del
   * todo, en segundos.
   */
  private readonly trailDuration = 0.55;

  constructor(private readonly container: Container) {}

  init(): void {}

  isEnabled(particle: Particle): boolean {
    return (
      Boolean(particle.options.move?.straight) &&
      !particle.destroyed &&
      !particle.spawning
    );
  }

  update(particle: Particle, delta: IDelta): void {
    if (!this.isEnabled(particle)) {
      return;
    }

    const elapsed =
      (cometTrailTimers.get(particle) ?? 0) + delta.value;

    if (elapsed < this.spawnIntervalMs) {
      cometTrailTimers.set(particle, elapsed);
      return;
    }

    cometTrailTimers.set(particle, 0);

    const cometSize =
      (particle.size as { value?: number })?.value ?? 3;
    const cometColor =
      (particle.options.color as { value?: unknown })?.value ??
      "#ffffff";

    this.container.particles.addParticle(
      { x: particle.position.x, y: particle.position.y },
      {
        shape: { type: "circle" },

        move: { enable: false },

        color: { value: cometColor },

        /**
         * FIX: sin esto, los puntos de la estela HEREDAN la
         * configuración de `links` de las partículas base
         * (enable:true, distance:105). Como se generan muy
         * pegados entre sí siguiendo la línea recta del cometa,
         * el motor los enlazaba a todos entre sí con líneas casi
         * solapadas -> visualmente parecía un rayo/triángulo
         * sólido en vez de una estela de puntos sueltos.
         */
        links: { enable: false },

        /**
         * Igual de importante: si no lo desactivamos aquí, cada
         * punto de la estela también intenta el efecto de brillo
         * (twinkle) de las partículas base, añadiendo parpadeos
         * extra innecesarios sobre un efecto que ya de por sí
         * parpadea al nacer/morir constantemente.
         */
        twinkle: { particles: { enable: false } },

        size: {
          value: { min: 0, max: cometSize * 0.6 },
          animation: {
            enable: true,
            speed: 4,
            sync: false,
            startValue: "max",
            destroy: "min",
          },
        },

        opacity: {
          value: { min: 0, max: 0.85 },
          animation: {
            enable: true,
            speed: 3,
            sync: false,
            startValue: "max",
            destroy: "min",
          },
        },

        life: {
          count: 1,
          duration: { value: this.trailDuration },
        },
      },
      "comet-trail",
    );
  }
}

const loadCometTrail = async () => {
  await tsParticles.pluginManager.register((engine) => {
    if (!engine.pluginManager.addParticleUpdater) {
      console.error(
        "[comet-trail] addParticleUpdater no está disponible: " +
          "revisa la versión de @tsparticles/engine.",
      );
      return;
    }

    engine.pluginManager.addParticleUpdater(
      "comet-trail",
      (container: Container) =>
        Promise.resolve(new CometTrailUpdater(container)),
    );
  });
};

/**
 * ============================================================
 * AMBIENT RETURN (rellenar los huecos que deja el repulse)
 * ============================================================
 *
 * Al empujar TODAS las estrellas cercanas a un proyecto, la zona
 * alrededor se queda vacía — y como las estrellas normales van
 * muy lentas (0.03-0.18px/frame) y con movimiento aleatorio,
 * tardan mucho en volver a rellenar ese hueco por sí solas.
 *
 * En vez de atarlas a un punto fijo (se vería robótico), les
 * damos una "zona libre" amplia alrededor de donde nacieron
 * (deadZoneRadius): dentro de esa zona no hacemos nada, vagan
 * con total libertad, igual que antes. Solo si se alejan MÁS de
 * esa zona (por ejemplo, empujadas por el repulse) empieza a
 * tirar de ellas suavemente hacia su vecindario de origen — así
 * el hueco se rellena solo en unos segundos, en vez de quedar
 * vacío indefinidamente.
 */
const ambientHomePositions = new WeakMap<
  Particle,
  { x: number; y: number }
>();

class AmbientReturnUpdater {
  private readonly deadZoneRadius = 90;

  private readonly pullStrength = 0.00035;

  init(particle: Particle): void {
    if (
      particle.group === "projects" ||
      particle.group === "comet-trail" ||
      particle.options.move?.straight
    ) {
      return;
    }

    ambientHomePositions.set(particle, {
      x: particle.position.x,
      y: particle.position.y,
    });
  }

  isEnabled(particle: Particle): boolean {
    return (
      !particle.destroyed &&
      !particle.spawning &&
      particle.group !== "projects" &&
      particle.group !== "comet-trail" &&
      !particle.options.move?.straight
    );
  }

  update(particle: Particle, delta: IDelta): void {
    if (!this.isEnabled(particle)) {
      return;
    }

    /**
     * Igual que en los cometas: disipamos el exceso de velocidad
     * SIEMPRE, esté o no fuera de su zona libre. Antes una
     * estrella empujada por el repulse conservaba esa velocidad
     * extra indefinidamente, así que aunque el tirón la trajera
     * de vuelta, seguía viajando mucho más rápido que su ritmo
     * normal y se pasaba de largo constantemente.
     */
    decayExcessSpeed(particle, delta);

    const home = ambientHomePositions.get(particle);

    if (!home) {
      return;
    }

    const dx = home.x - particle.position.x;
    const dy = home.y - particle.position.y;
    const distance = Math.sqrt(dx * dx + dy * dy);

    /**
     * Dentro de su zona libre: no tocamos nada, que vague a sus
     * anchas como siempre.
     */
    if (distance <= this.deadZoneRadius) {
      return;
    }

    /**
     * Fuera de la zona libre: cuanto más lejos, más fuerte tira
     * de vuelta (pero siempre suave, no debe notarse como una
     * atadura). Convertido a píxeles reales igual que el push y
     * el comet-return -- ver esa explicación más arriba.
     */
    const excess = distance - this.deadZoneRadius;
    const nx = dx / distance;
    const ny = dy / distance;
    const moveSpeed = particle.retina.moveSpeed || 1;

    particle.velocity.x +=
      (nx * this.pullStrength * excess * delta.factor) /
      moveSpeed;

    particle.velocity.y +=
      (ny * this.pullStrength * excess * delta.factor) /
      moveSpeed;
  }
}

const loadAmbientReturn = async () => {
  await tsParticles.pluginManager.register((engine) => {
    if (!engine.pluginManager.addParticleUpdater) {
      console.error(
        "[ambient-return] addParticleUpdater no está disponible: " +
          "revisa la versión de @tsparticles/engine.",
      );
      return;
    }

    engine.pluginManager.addParticleUpdater(
      "ambient-return",
      () => Promise.resolve(new AmbientReturnUpdater()),
    );
  });
};

/**
 * ============================================================
 * REGISTER PROJECT REPULSE
 * ============================================================
 */
/**
 * ============================================================
 * PROJECT TOOLTIP + CLICK
 * ============================================================
 *
 * tsParticles solo gestiona la física de las partículas — no
 * tiene ningún sistema de "elementos clicables" con nombre,
 * tooltip, etc. Eso lo montamos aparte con listeners nativos del
 * DOM sobre el propio <canvas> que genera `fullScreen`.
 *
 * Punto importante: `container.canvas.size` está en píxeles
 * "internos" del canvas (multiplicados por devicePixelRatio si
 * detectRetina está activo), mientras que `clientX/clientY` de
 * los eventos del ratón vienen en píxeles CSS. Hay que convertir
 * entre ambos sistemas usando el `getBoundingClientRect()` del
 * canvas — si no, en pantallas retina el hitbox de los proyectos
 * queda desplazado y parece que "no hace click".
 */
const setupProjectInteraction = (container: Container) => {
  const canvasElement = container.canvas.domElement;

  if (!canvasElement) {
    console.warn(
      "[projects] No se encontró el elemento <canvas>; " +
        "el tooltip y el click de los proyectos no van a funcionar.",
    );
    return;
  }

  const tooltip = document.createElement("div");

  tooltip.style.position = "fixed";
  tooltip.style.pointerEvents = "none";
  tooltip.style.padding = "6px 10px";
  tooltip.style.borderRadius = "6px";
  tooltip.style.background = "rgba(10, 8, 20, 0.85)";
  tooltip.style.color = "#f5f3ff";
  tooltip.style.font = "13px system-ui, sans-serif";
  tooltip.style.border = "1px solid rgba(255, 255, 255, 0.15)";
  tooltip.style.transform = "translate(-50%, -140%)";
  tooltip.style.transition = "opacity 0.12s ease";
  tooltip.style.opacity = "0";
  tooltip.style.zIndex = "9999";
  tooltip.style.whiteSpace = "nowrap";

  document.body.appendChild(tooltip);

  /**
   * Convierte una coordenada de pantalla (clientX/Y) a
   * coordenadas internas del canvas.
   */
  const toCanvasPoint = (clientX: number, clientY: number) => {
    const rect = canvasElement.getBoundingClientRect();
    const canvasSize = container.canvas.size;

    return {
      x: ((clientX - rect.left) / rect.width) * canvasSize.width,
      y: ((clientY - rect.top) / rect.height) * canvasSize.height,
    };
  };

  window.addEventListener("mousemove", (event) => {
    const point = toCanvasPoint(event.clientX, event.clientY);
    const project = findProjectAtPoint(point, container.canvas.size);

    if (project) {
      tooltip.textContent = project.title;
      tooltip.style.left = `${event.clientX}px`;
      tooltip.style.top = `${event.clientY}px`;
      tooltip.style.opacity = "1";
      canvasElement.style.cursor = "pointer";
    } else {
      tooltip.style.opacity = "0";
      canvasElement.style.cursor = "";
    }
  });

  window.addEventListener("click", (event) => {
    const point = toCanvasPoint(event.clientX, event.clientY);
    const project = findProjectAtPoint(point, container.canvas.size);

    if (!project) {
      return;
    }

    /**
     * Aquí decides qué hacer al hacer click sobre un proyecto:
     * navegar a su página, abrir un modal, etc. Para no acoplar
     * este archivo a tu router/UI, disparamos un CustomEvent que
     * el resto de tu app puede escuchar donde le convenga:
     *
     *   window.addEventListener("project-click", (e) => {
     *     console.log(e.detail.id, e.detail.title);
     *   });
     */
    window.dispatchEvent(
      new CustomEvent("project-click", {
        detail: { id: project.id, title: project.title },
      }),
    );
  });
};

/**
 * ============================================================
 * PROJECT ORBIT (movimiento sujeto a resorte)
 * ============================================================
 *
 * Queremos que las estrellas de proyecto se muevan un poco, pero
 * SIN salir nunca de pantalla. En vez de usar `move.enable` +
 * `outModes` (que las dejaría vagar libremente por todo el
 * canvas, perdiendo su posición de "marcador"), les damos
 * `move.enable: false` y las movemos nosotros mismos cada frame
 * con un updater personalizado:
 *
 * - Cada partícula "recuerda" su posición de origen (`home`),
 *   capturada la primera vez que se inicializa.
 * - Cada frame se le aplica un pequeño empujón aleatorio (da
 *   sensación de vida) más una fuerza de resorte que tira de
 *   vuelta hacia `home`.
 * - Como red de seguridad, si aun así se aleja más de
 *   `maxOrbitRadius` píxeles de su origen, se recorta la
 *   posición a ese radio. Y como red de seguridad ABSOLUTA, la
 *   posición final siempre se limita a los bordes del canvas.
 *
 * Se registra igual que cualquier updater oficial de tsParticles
 * (wobble, twinkle, etc.), vía `engine.pluginManager.addParticleUpdater`.
 */
const projectHomePositions = new WeakMap<
  Particle,
  { x: number; y: number }
>();

class ProjectOrbitUpdater {
  private readonly maxOrbitRadius = 14;

  private readonly springStrength = 0.006;

  private readonly jitterStrength = 0.05;

  private readonly damping = 0.92;

  constructor(private readonly container: Container) {}

  init(particle: Particle): void {
    if (particle.group !== "projects") {
      return;
    }

    /**
     * Guardamos la posición de origen la primera vez que vemos
     * esta partícula (justo cuando la creamos en
     * `addProjectParticles`, así que su posición actual ES su
     * posición "correcta").
     */
    projectHomePositions.set(particle, {
      x: particle.position.x,
      y: particle.position.y,
    });
  }

  isEnabled(particle: Particle): boolean {
    return (
      particle.group === "projects" &&
      !particle.destroyed &&
      !particle.spawning
    );
  }

  update(particle: Particle, delta: IDelta): void {
    if (!this.isEnabled(particle)) {
      return;
    }

    const home = projectHomePositions.get(particle);

    if (!home) {
      return;
    }

    /**
     * Empujoncito aleatorio constante -> sensación de vida.
     */
    particle.velocity.x +=
      (Math.random() - 0.5) * this.jitterStrength * delta.factor;

    particle.velocity.y +=
      (Math.random() - 0.5) * this.jitterStrength * delta.factor;

    /**
     * Fuerza de resorte hacia la posición de origen: cuanto más
     * lejos está, más fuerte tira hacia atrás.
     */
    const dx = home.x - particle.position.x;
    const dy = home.y - particle.position.y;

    particle.velocity.x += dx * this.springStrength * delta.factor;
    particle.velocity.y += dy * this.springStrength * delta.factor;

    /**
     * Amortiguación: sin esto, oscilaría para siempre.
     */
    particle.velocity.x *= this.damping;
    particle.velocity.y *= this.damping;

    particle.position.x += particle.velocity.x * delta.factor;
    particle.position.y += particle.velocity.y * delta.factor;

    /**
     * RED DE SEGURIDAD 1: nunca más lejos que `maxOrbitRadius`
     * de su posición de origen.
     */
    const offsetX = particle.position.x - home.x;
    const offsetY = particle.position.y - home.y;
    const distance = Math.sqrt(offsetX * offsetX + offsetY * offsetY);

    if (distance > this.maxOrbitRadius) {
      const scale = this.maxOrbitRadius / distance;

      particle.position.x = home.x + offsetX * scale;
      particle.position.y = home.y + offsetY * scale;
    }

    /**
     * RED DE SEGURIDAD 2 (absoluta): pase lo que pase, jamás
     * fuera de los límites del canvas.
     */
    const canvasSize = this.container.canvas.size;

    particle.position.x = Math.min(
      Math.max(particle.position.x, 0),
      canvasSize.width,
    );

    particle.position.y = Math.min(
      Math.max(particle.position.y, 0),
      canvasSize.height,
    );
  }
}

const loadProjectOrbit = async () => {
  await tsParticles.pluginManager.register((engine) => {
    if (!engine.pluginManager.addParticleUpdater) {
      console.error(
        "[project-orbit] addParticleUpdater no está disponible: " +
          "revisa la versión de @tsparticles/engine.",
      );
      return;
    }

    engine.pluginManager.addParticleUpdater(
      "project-orbit",
      (container: Container) => {
        return Promise.resolve(new ProjectOrbitUpdater(container));
      },
    );
  });
};

const loadProjectRepulse = async () => {
  await loadInteractivityPlugin(tsParticles);

  await tsParticles.pluginManager.register((engine) => {
    /**
     * `addInteractor` puede no existir si el plugin de
     * interactividad no llegó a registrarse (p. ej. por un error
     * de carga silencioso en otro punto del bundle). Antes esto
     * fallaba en silencio con `?.`; ahora avisamos por consola
     * para que un fallo de este tipo no vuelva a pasar
     * desapercibido.
     */
    if (!engine.pluginManager.addInteractor) {
      console.error(
        "[project-repulse] addInteractor no está disponible: " +
          "revisa que @tsparticles/plugin-interactivity esté " +
          "correctamente instalado y cargado.",
      );
      return;
    }

    engine.pluginManager.addInteractor(
      "project-repulse",
      (container: Container) => {
        return Promise.resolve(
          new ProjectRepulseInteractor(container),
        );
      },
    );
  });
};

/**
 * ============================================================
 * PROJECT MANUAL PARTICLES — OPTIONS
 * ============================================================
 *
 * IMPORTANTE — HISTORIAL DEL BUG:
 *
 * Antes usábamos la opción declarativa `manualParticles` de
 * tsParticles. Sobre el papel es la forma "oficial" de añadir
 * partículas fijas, PERO tiene un problema serio verificado en el
 * código fuente del motor (@tsparticles/engine):
 *
 * 1. Las manualParticles se añaden SIN un `group` (quedan en el
 *    grupo `undefined`, el mismo que las estrellas de fondo).
 * 2. Cada vez que se recalcula la densidad — al cargar Y EN CADA
 *    RESIZE de ventana (`ParticlesManager.setDensity()`, llamado
 *    también desde `CanvasManager` en resize) — si "sobran"
 *    partículas respecto al target de densidad, el motor borra
 *    con `removeQuantity()`, que elimina EMPEZANDO DESDE EL
 *    ÍNDICE 0 del array de partículas del grupo.
 * 3. Como las manualParticles se insertan ANTES que las
 *    partículas aleatorias, quedan en los primeros índices —
 *    literalmente las primeras candidatas a ser borradas si el
 *    cálculo de densidad decide que hay demasiadas partículas
 *    para el tamaño de pantalla actual.
 *
 * Lo comprobé de forma empírica: con density.enable activado y
 * una ventana de tamaño moderado, las 4 estrellas de proyecto
 * desaparecían del array de partículas sin ningún error/warning
 * en consola — exactamente el síntoma reportado.
 *
 * LA SOLUCIÓN: añadimos los proyectos nosotros mismos, DESPUÉS
 * de que el container ya esté cargado (así el cálculo de
 * densidad de las estrellas normales ya se ha asentado), y en un
 * GRUPO PROPIO ("projects") con `density.enable: false`. El
 * grupo con densidad desactivada nunca entra en la lógica de
 * borrado — lo confirmé forzando manualmente una segunda pasada
 * de `setDensity()` (simulando un resize) y las 4 partículas
 * sobrevivieron intactas.
 */
const createProjectParticlesOptions = (project: (typeof projects)[number]) => ({
  /**
   * Forma.
   */
  shape: {
    type: "star",
  },

  /**
   * Tamaño.
   */
  size: {
    value: project.size,
  },

  /**
   * Color individual.
   */
  color: {
    value: project.color,
  },

  /**
   * Totalmente opacas.
   */
  opacity: {
    value: 1,
  },

  /**
   * Pequeño borde.
   */
  stroke: {
    width: 1,
    color: project.color,
    opacity: 0.5,
  },

  /**
   * Los proyectos NO viajan por el espacio.
   */
  move: {
    enable: false,
  },

  /**
   * Pequeño efecto de brillo.
   */
  twinkle: {
    particles: {
      enable: true,
      frequency: 0.04,
      opacity: 0.9,
    },
  },

  /**
   * Los proyectos también pueden formar
   * conexiones con estrellas cercanas.
   */
  links: {
    enable: true,

    distance: 145,

    opacity: 0.35,

    width: 0.8,

    color: project.color,
  },
});

/**
 * ============================================================
 * ADD PROJECT PARTICLES
 * ============================================================
 *
 * Se llama DESPUÉS de `tsParticles.load(...)`, nunca antes.
 * `getPosition` es la misma utilidad que usa internamente el
 * plugin de manual particles para convertir porcentaje -> px.
 */
const addProjectParticles = (container: Container) => {
  for (const project of projects) {
    container.particles.addParticle(
      getPosition(
        { x: project.x, y: project.y, mode: "percent" },
        container.canvas.size,
      ),
      createProjectParticlesOptions(project),
      "projects",
    );
  }
};

/**
 * ============================================================
 * INIT
 * ============================================================
 */
/**
 * ============================================================
 * WAIT FOR LAYOUT
 * ============================================================
 *
 * Con `fullScreen: true`, tsParticles necesita conocer el tamaño
 * real del canvas para posicionar las manualParticles (que son
 * porcentaje del canvas). Si el layout del navegador todavía no
 * está asentado en el instante de `tsParticles.load()`, el canvas
 * puede leerse como 0x0 en ese preciso tick, y como las manual
 * particles no se mueven ni se recalculan en resize, se quedan
 * clavadas en una posición inválida para siempre.
 *
 * Esperamos dos frames (raf x2) antes de inicializar: es
 * suficiente para que el navegador haya completado layout/paint
 * del canvas fullscreen recién insertado en el DOM.
 */
const waitForLayout = () =>
  new Promise<void>((resolve) => {
    requestAnimationFrame(() => {
      requestAnimationFrame(() => resolve());
    });
  });

const initSpace = async () => {
  await waitForLayout();

  /**
   * ==========================================================
   * LOAD FULL
   * ==========================================================
   *
   * IMPORTANTE: `loadFull` NO incluye el plugin de manual
   * particles ni el plugin de trail (verificado en el código
   * fuente de "tsparticles/browser/index.js"). Por eso los
   * cargamos explícitamente justo debajo — eso ya lo tenías bien.
   */
  await loadFull(tsParticles);

  /**
   * ==========================================================
   * CUSTOM REPULSE
   * ==========================================================
   */
  await loadProjectRepulse();

  /**
   * ==========================================================
   * CUSTOM ORBIT
   * ==========================================================
   */
  await loadProjectOrbit();

  /**
   * ==========================================================
   * COMET RETURN
   * ==========================================================
   */
  await loadCometReturn();

  /**
   * ==========================================================
   * COMET TRAIL
   * ==========================================================
   */
  await loadCometTrail();

  /**
   * ==========================================================
   * AMBIENT RETURN
   * ==========================================================
   */
  await loadAmbientReturn();

  /**
   * ==========================================================
   * PARTICLES
   * ==========================================================
   */
  const container = await tsParticles.load({
    id: "stars",

    options: {
      /**
       * ======================================================
       * CANVAS
       * ======================================================
       */
      fullScreen: {
        enable: true,

        zIndex: -1,
      },

      background: {
        color: "#020204",
      },

      fpsLimit: 60,

      detectRetina: true,

      /**
       * ======================================================
       * MOTION
       * ======================================================
       */
      motion: {
        disable: false,

        reduce: true,
      },

      /**
       * ======================================================
       * NORMAL STARS
       * ======================================================
       */
      particles: {
        number: {
          value: 125,

          density: {
            enable: true,

            /**
             * FIX: `area` no es una propiedad válida de las
             * opciones de densidad de tsParticles (verificado en
             * la clase ParticlesDensity del motor: solo existen
             * `width` y `height`, por defecto 1920x1080). Con
             * `area` el motor la ignoraba en silencio y usaba
             * esos defaults, lo que en ventanas más pequeñas que
             * 1920x1080 hacía que "sobraran" partículas y
             * disparaba el borrado de setDensity() — el
             * detonante del bug de los proyectos invisibles.
             */
            width: 1000,

            height: 1000,
          },
        },

        /**
         * Estrellas + pequeños puntos.
         */
        shape: {
          type: [
            "star",
            "circle",
          ],
        },

        /**
         * Tamaño pequeño.
         */
        size: {
          value: {
            min: 0.6,

            max: 2.1,
          },
        },

        /**
         * Opacidad aleatoria.
         */
        opacity: {
          value: {
            min: 0.15,

            max: 0.75,
          },
        },

        /**
         * Paleta espacial.
         */
        color: {
          value: [
            "#ffffff",
            "#e9d5ff",
            "#c4b5fd",
            "#a78bfa",
            "#818cf8",
            "#93c5fd",
          ],
        },

        /**
         * ====================================================
         * STAR MOVEMENT
         * ====================================================
         */
        move: {
          enable: true,

          speed: {
            min: 0.03,

            max: 0.18,
          },

          direction: "none",

          random: true,

          straight: false,

          outModes: {
            default: "bounce",
          },
        },

        /**
         * ====================================================
         * CONSTELLATIONS
         * ====================================================
         */
        links: {
          enable: true,

          distance: 105,

          opacity: 0.075,

          width: 0.5,

          color: "#8b7cff",
        },

        /**
         * ====================================================
         * TWINKLE
         * ====================================================
         */
        twinkle: {
          particles: {
            enable: true,

            frequency: 0.025,

            opacity: 1,
          },
        },

        /**
         * ====================================================
         * BOUNCE
         * ====================================================
         */
        bounce: {
          horizontal: {
            value: 1,
          },

          vertical: {
            value: 1,
          },
        },

        /**
         * ====================================================
         * PROJECTS GROUP
         * ====================================================
         *
         * Grupo dedicado a las estrellas de proyecto, con la
         * densidad DESACTIVADA. Así quedan completamente fuera
         * del sistema de recuento/purga por densidad que usan
         * las estrellas de fondo (ver `addProjectParticles`).
         */
        groups: {
          projects: {
            number: {
              value: 0,

              density: {
                enable: false,
              },
            },
          },

          /**
           * Puntos fantasma de la estela de los cometas — mismo
           * motivo: fuera del sistema de densidad para que
           * `setDensity()` no los purgue en un resize.
           */
          "comet-trail": {
            number: {
              value: 0,

              density: {
                enable: false,
              },
            },
          },
        },
      },

      /**
       * ======================================================
       * PROJECTS
       * ======================================================
       *
       * Los proyectos YA NO se declaran aquí como
       * `manualParticles` — se añaden explícitamente después de
       * `tsParticles.load(...)` mediante `addProjectParticles()`.
       * Ver el comentario junto a `createProjectParticlesOptions`
       * para la explicación completa del bug que esto soluciona.
       */

      /**
       * ======================================================
       * INTERACTIVITY
       * ======================================================
       */
      interactivity: {
        detectsOn: "window",

        events: {
          onHover: {
            enable: true,

            mode: "project-repulse",
          },

          resize: {
            enable: true,
          },
        },

        modes: {
          /**
           * Este objeto puede quedarse vacío.
           *
           * Nuestro interactor utiliza sus propios valores.
           */
          "project-repulse": {},
        },
      },

      /**
       * ======================================================
       * COMETS
       * ======================================================
       */
      emitters: [
        /**
         * ----------------------------------------------------
         * COMET RIGHT
         * ----------------------------------------------------
         */
        {
          name: "comet-right",

          position: {
            x: 0,

            y: 25,
          },

          direction: "right",

          size: {
            width: 0,

            height: 25,

            mode: "percent",
          },

          rate: {
            quantity: 1,

            delay: 3.5,
          },

          particles: {
            shape: {
              type: "circle",
            },

            color: {
              value: [
                "#ffffff",
                "#c4b5fd",
                "#93c5fd",
              ],
            },

            size: {
              value: {
                min: 1.5,

                max: 3,
              },
            },

            opacity: {
              value: {
                min: 0.7,

                max: 1,
              },
            },

            move: {
              enable: true,

              direction: "right",

              speed: {
                min: 7,

                max: 11,
              },

              straight: true,

              outModes: {
                default: "destroy",
              },
            },
          },
        },

        /**
         * ----------------------------------------------------
         * COMET LEFT
         * ----------------------------------------------------
         */
        {
          name: "comet-left",

          position: {
            x: 100,

            y: 70,
          },

          direction: "left",

          size: {
            width: 0,

            height: 20,

            mode: "percent",
          },

          rate: {
            quantity: 1,

            delay: 5,
          },

          particles: {
            shape: {
              type: "circle",
            },

            color: {
              value: [
                "#ffffff",
                "#a78bfa",
                "#818cf8",
              ],
            },

            size: {
              value: {
                min: 1.5,

                max: 3,
              },
            },

            opacity: {
              value: {
                min: 0.7,

                max: 1,
              },
            },

            move: {
              enable: true,

              direction: "left",

              speed: {
                min: 8,

                max: 12,
              },

              straight: true,

              outModes: {
                default: "destroy",
              },
            },
          },
        },

        /**
         * ----------------------------------------------------
         * COMET DIAGONAL
         * ----------------------------------------------------
         */
        {
          name: "comet-diagonal",

          position: {
            x: 15,

            y: 0,
          },

          direction: "bottom-right",

          size: {
            width: 25,

            height: 0,

            mode: "percent",
          },

          rate: {
            quantity: 1,

            delay: 7,
          },

          particles: {
            shape: {
              type: "circle",
            },

            color: {
              value: "#ffffff",
            },

            size: {
              value: {
                min: 1,

                max: 2.5,
              },
            },

            opacity: {
              value: 0.9,
            },

            move: {
              enable: true,

              direction: "bottom-right",

              speed: {
                min: 6,

                max: 9,
              },

              straight: true,

              outModes: {
                default: "destroy",
              },
            },
          },
        },
      ],
    },
  });

  /**
   * Añadimos las estrellas de proyecto AHORA, con el container ya
   * completamente inicializado (canvas con tamaño real, densidad
   * de las estrellas de fondo ya asentada). Al ir en el grupo
   * "projects" (density.enable: false), quedan a salvo de futuras
   * pasadas de setDensity() — incluidas las que se disparan en
   * cada resize de ventana.
   */
  if (container) {
    addProjectParticles(container);
    setupProjectInteraction(container);
  }
};

initSpace().catch(console.error);