import "./style.css";
import { gsap } from "gsap";

const $ = (selector) =>
  document.querySelector(selector);

const $$ = (selector) =>
  [...document.querySelectorAll(selector)];

const wait = (milliseconds) =>
  new Promise(
    (resolve) =>
      setTimeout(resolve, milliseconds)
  );

const tween = (
  target,
  variables
) =>
  new Promise(
    (resolve) =>
      gsap.to(target, {
        ...variables,
        onComplete: resolve
      })
  );

const fromTo = (
  target,
  fromVariables,
  toVariables
) =>
  new Promise(
    (resolve) =>
      gsap.fromTo(
        target,
        fromVariables,
        {
          ...toVariables,
          onComplete: resolve
        }
      )
  );

/* CONFIGURAÇÕES */

const VOLUME_TRISTE = 0.18;
const VOLUME_ROMANTICA = 0.11;

const DURACAO_CROSSFADE_INICIAL = 10;
const DURACAO_CROSSFADE_QUASE = 8;
const DURACAO_CROSSFADE_NOS = 8;

const TEMPO_TITULO = 3700;
const TEMPO_TRANSICAO_TEXTO = 4400;

const MULTIPLICADOR_LEITURA = 1.55;

/* IMAGENS DO SITE */

/*
  Primeiro serão preparadas apenas a capa
  e as imagens da primeira memória.

  As outras cenas serão carregadas depois,
  em segundo plano e na ordem da história.
*/

const gruposDeImagens = {
  abertura: [
    "/imagens/capa-livro.png"
  ],

  passado: [
    "/imagens/passado-floresta.png",
    "/imagens/passado-lua-cheia.png",
    "/imagens/passado-tragedia.png",
    "/imagens/passado-lobo-solitario.png",
    "/imagens/passado-mudanca.png"
  ],

  cassino: [
    "/imagens/observandocassino.png",
    "/imagens/conversacassino.png"
  ],

  tinder: [
    "/imagens/tinderjasper.png",
    "/imagens/tindermorgana.png"
  ],

  gramado: [
    "/imagens/cassinoencontro.png"
  ],

  quase: [
    "/imagens/diasdificeis.png",
    "/imagens/diasdificeis2.png"
  ],

  chuva: [
    "/imagens/pedidodenamoro.png"
  ],

  ritual: [
    "/imagens/ritualmorg.png"
  ],

  nos: [
    "/imagens/nos.png"
  ],

  final: [
    "/imagens/casalfinal.png",
    "/imagens/parte-final-livro.png"
  ]
};

const imagensCriticas = [
  ...gruposDeImagens.abertura,
  ...gruposDeImagens.passado
];

/*
  Guarda tanto a promessa quanto o elemento de imagem.

  Manter o elemento vivo impede que o navegador
  descarte a imagem já preparada da memória.
*/

const cacheDeImagens =
  new Map();

const imagensMantidas =
  new Map();

let cacheVisual =
  null;

function obterCacheVisual() {
  if (cacheVisual) {
    return cacheVisual;
  }

  cacheVisual =
    document.createElement(
      "div"
    );

  cacheVisual.id =
    "image-memory-cache";

  cacheVisual.setAttribute(
    "aria-hidden",
    "true"
  );

  Object.assign(
    cacheVisual.style,
    {
      position: "fixed",
      left: "-10000px",
      top: "-10000px",
      width: "2px",
      height: "2px",
      overflow: "hidden",
      opacity: "0.001",
      pointerEvents: "none",
      zIndex: "-1"
    }
  );

  document.body.appendChild(
    cacheVisual
  );

  return cacheVisual;
}

function manterImagemNaMemoria(
  imagem,
  endereco
) {
  if (
    imagensMantidas.has(
      endereco
    )
  ) {
    return;
  }

  imagem.alt = "";

  imagem.width = 1;
  imagem.height = 1;

  Object.assign(
    imagem.style,
    {
      display: "block",
      width: "1px",
      height: "1px",
      objectFit: "cover"
    }
  );

  obterCacheVisual()
    .appendChild(
      imagem
    );

  imagensMantidas.set(
    endereco,
    imagem
  );
}

function carregarImagem(
  endereco,
  prioridade = "auto"
) {
  if (
    cacheDeImagens.has(
      endereco
    )
  ) {
    return cacheDeImagens.get(
      endereco
    );
  }

  const carregamento =
    new Promise(
      (resolve) => {
        const imagem =
          new Image();

        let finalizado =
          false;

        const terminar = (
          carregou,
          motivo = ""
        ) => {
          if (finalizado) {
            return;
          }

          finalizado = true;

          clearTimeout(
            tempoLimite
          );

          resolve({
            endereco,
            carregou,
            motivo
          });
        };

        const tempoLimite =
          setTimeout(
            () => {
              console.warn(
                `Tempo excedido ao carregar: ${endereco}`
              );

              terminar(
                false,
                "tempo excedido"
              );
            },
            45000
          );

        imagem.loading =
          "eager";

        imagem.decoding =
          "async";

        try {
          imagem.fetchPriority =
            prioridade;
        } catch {
          // Navegadores antigos podem não possuir fetchPriority.
        }

        imagem.onload =
          async () => {
            try {
              await imagem.decode();
            } catch {
              /*
                A imagem já terminou de carregar.
                Alguns navegadores rejeitam decode()
                mesmo quando ela está pronta.
              */
            }

            manterImagemNaMemoria(
              imagem,
              endereco
            );

            terminar(
              true
            );
          };

        imagem.onerror =
          () => {
            console.error(
              `Imagem não encontrada: ${endereco}`
            );

            terminar(
              false,
              "arquivo não encontrado"
            );
          };

        imagem.src =
          endereco;
      }
    );

  cacheDeImagens.set(
    endereco,
    carregamento
  );

  return carregamento;
}

async function carregarImagensEmFila(
  lista,
  limite,
  aoConcluir = () => {}
) {
  let proximoIndice = 0;

  async function trabalhador() {
    while (
      proximoIndice <
      lista.length
    ) {
      const indice =
        proximoIndice;

      proximoIndice += 1;

      const endereco =
        lista[indice];

      const prioridade =
        indice < 2
          ? "high"
          : "auto";

      const resultado =
        await carregarImagem(
          endereco,
          prioridade
        );

      aoConcluir(
        resultado
      );
    }
  }

  const quantidade =
    Math.min(
      limite,
      lista.length
    );

  const trabalhadores =
    Array.from(
      {
        length: quantidade
      },
      () => trabalhador()
    );

  await Promise.all(
    trabalhadores
  );
}

async function carregarRestanteEmSegundoPlano() {
  /*
    Ordem das imagens baseada na ordem da história.

    Apenas duas imagens serão carregadas simultaneamente,
    evitando sobrecarregar a internet e a memória.
  */

  const filaDeGrupos = [
    gruposDeImagens.cassino,
    gruposDeImagens.tinder,
    gruposDeImagens.gramado,
    gruposDeImagens.quase,
    gruposDeImagens.chuva,
    gruposDeImagens.ritual,
    gruposDeImagens.nos,
    gruposDeImagens.final
  ];

  for (
    const grupo of filaDeGrupos
  ) {
    await carregarImagensEmFila(
      grupo,
      2
    );

    /*
      Pequena pausa para o navegador respirar
      entre um grupo de cenas e outro.
    */

    await wait(
      250
    );
  }

  console.log(
    "Todas as imagens da história foram preparadas."
  );
}

/* MÚSICAS */

function criarAudio(
  endereco,
  repetir
) {
  const audio =
    new Audio();

  audio.preload =
    "none";

  audio.loop =
    repetir;

  audio.volume = 0;

  audio.src =
    endereco;

  return audio;
}

const musicaTriste =
  criarAudio(
    "/audio/musicatriste.mp3",
    false
  );

const musicaRomantica =
  criarAudio(
    "/audio/musicaromantica.mp3",
    true
  );

const musicaRomantica2 =
  criarAudio(
    "/audio/musicaromantica2.mp3",
    true
  );

const musicaRomantica3 =
  criarAudio(
    "/audio/musicaromantica3.mp3",
    true
  );

const todasAsMusicas = [
  musicaTriste,
  musicaRomantica,
  musicaRomantica2,
  musicaRomantica3
];

let musicaTristeIniciada = false;
let musicaRomanticaIniciada = false;
let musicaRomantica2Iniciada = false;
let musicaRomantica3Iniciada = false;

let musicaSilenciada = false;

let segundaMusicaPromise = null;
let terceiraMusicaPromise = null;

function prepararAudio(
  musica
) {
  musica.preload =
    "auto";

  if (musica.readyState < 2) {
    musica.load();
  }
}

function prepararMusicasEmSegundoPlano() {
  prepararAudio(
    musicaTriste
  );

  setTimeout(
    () => {
      prepararAudio(
        musicaRomantica
      );
    },
    2500
  );

  setTimeout(
    () => {
      prepararAudio(
        musicaRomantica2
      );
    },
    6000
  );

  setTimeout(
    () => {
      prepararAudio(
        musicaRomantica3
      );
    },
    9500
  );
}

async function iniciarMusicaTriste() {
  if (musicaTristeIniciada) {
    return;
  }

  musicaTristeIniciada = true;

  try {
    prepararAudio(
      musicaTriste
    );

    musicaTriste.pause();

    try {
      musicaTriste.currentTime = 0;
    } catch {
      // O áudio ainda será iniciado do começo.
    }

    musicaTriste.volume = 0;
    musicaTriste.muted =
      musicaSilenciada;

    await musicaTriste.play();

    gsap.killTweensOf(
      musicaTriste
    );

    gsap.to(
      musicaTriste,
      {
        volume: VOLUME_TRISTE,
        duration: 4.8,
        ease: "power1.out"
      }
    );
  } catch (error) {
    musicaTristeIniciada = false;

    console.warn(
      "A música triste não pôde ser iniciada.",
      error
    );
  }
}

async function iniciarPrimeiraMusicaRomantica() {
  if (musicaRomanticaIniciada) {
    return;
  }

  musicaRomanticaIniciada = true;

  try {
    prepararAudio(
      musicaRomantica
    );

    musicaRomantica.pause();

    try {
      musicaRomantica.currentTime = 0;
    } catch {
      // O áudio ainda será iniciado do começo.
    }

    musicaRomantica.volume = 0;
    musicaRomantica.muted =
      musicaSilenciada;

    await musicaRomantica.play();

    gsap.killTweensOf(
      musicaTriste
    );

    gsap.killTweensOf(
      musicaRomantica
    );

    gsap.to(
      musicaTriste,
      {
        volume: 0,
        duration: DURACAO_CROSSFADE_INICIAL,
        ease: "power1.inOut",

        onComplete: () => {
          musicaTriste.pause();
        }
      }
    );

    gsap.to(
      musicaRomantica,
      {
        volume: VOLUME_ROMANTICA,
        duration: DURACAO_CROSSFADE_INICIAL,
        ease: "power1.inOut"
      }
    );
  } catch (error) {
    musicaRomanticaIniciada = false;

    console.warn(
      "A primeira música romântica não pôde ser iniciada.",
      error
    );
  }
}

function iniciarSegundaMusicaRomantica() {
  if (segundaMusicaPromise) {
    return segundaMusicaPromise;
  }

  segundaMusicaPromise =
    (async () => {
      if (musicaRomantica2Iniciada) {
        return;
      }

      musicaRomantica2Iniciada = true;

      try {
        prepararAudio(
          musicaRomantica2
        );

        gsap.killTweensOf(
          musicaRomantica
        );

        gsap.killTweensOf(
          musicaRomantica2
        );

        musicaRomantica2.pause();

        try {
          musicaRomantica2.currentTime = 0;
        } catch {
          // O áudio ainda será iniciado do começo.
        }

        musicaRomantica2.volume = 0.001;
        musicaRomantica2.muted =
          musicaSilenciada;

        await musicaRomantica2.play();

        gsap.to(
          musicaRomantica,
          {
            volume: 0,
            duration: DURACAO_CROSSFADE_QUASE,
            ease: "power1.inOut",

            onComplete: () => {
              musicaRomantica.pause();
            }
          }
        );

        gsap.to(
          musicaRomantica2,
          {
            volume: VOLUME_ROMANTICA,
            duration: DURACAO_CROSSFADE_QUASE,
            ease: "power1.inOut"
          }
        );
      } catch (error) {
        musicaRomantica2Iniciada = false;
        segundaMusicaPromise = null;

        console.warn(
          "A musicaromantica2.mp3 não pôde ser iniciada.",
          error
        );

        throw error;
      }
    })();

  return segundaMusicaPromise;
}

function iniciarTerceiraMusicaRomantica() {
  if (terceiraMusicaPromise) {
    return terceiraMusicaPromise;
  }

  terceiraMusicaPromise =
    (async () => {
      if (musicaRomantica3Iniciada) {
        return;
      }

      musicaRomantica3Iniciada = true;

      try {
        prepararAudio(
          musicaRomantica3
        );

        musicaRomantica3.pause();

        try {
          musicaRomantica3.currentTime = 0;
        } catch {
          // O áudio ainda será iniciado do começo.
        }

        musicaRomantica3.volume = 0.001;
        musicaRomantica3.muted =
          musicaSilenciada;

        await musicaRomantica3.play();

        todasAsMusicas.forEach(
          (musica) => {
            if (
              musica ===
              musicaRomantica3
            ) {
              return;
            }

            gsap.killTweensOf(
              musica
            );

            gsap.to(
              musica,
              {
                volume: 0,
                duration: DURACAO_CROSSFADE_NOS,
                ease: "power1.inOut",

                onComplete: () => {
                  musica.pause();
                }
              }
            );
          }
        );

        gsap.killTweensOf(
          musicaRomantica3
        );

        gsap.to(
          musicaRomantica3,
          {
            volume: VOLUME_ROMANTICA,
            duration: DURACAO_CROSSFADE_NOS,
            ease: "power1.inOut"
          }
        );
      } catch (error) {
        musicaRomantica3Iniciada = false;
        terceiraMusicaPromise = null;

        console.warn(
          "A musicaromantica3.mp3 não pôde ser iniciada.",
          error
        );

        throw error;
      }
    })();

  return terceiraMusicaPromise;
}

const musicToggle =
  $("#music-toggle");

musicToggle.addEventListener(
  "click",
  () => {
    musicaSilenciada =
      !musicaSilenciada;

    todasAsMusicas.forEach(
      (musica) => {
        musica.muted =
          musicaSilenciada;
      }
    );

    musicToggle.classList.toggle(
      "muted",
      musicaSilenciada
    );

    musicToggle.textContent =
      musicaSilenciada
        ? "×"
        : "♪";

    musicToggle.title =
      musicaSilenciada
        ? "Ativar música"
        : "Silenciar música";

    musicToggle.setAttribute(
      "aria-label",
      musicToggle.title
    );
  }
);

/* CARREGAMENTO INICIAL */

async function iniciarCarregamentoInicial() {
  const loader =
    $("#asset-loader");

  const loaderBar =
    $("#loader-bar");

  const loaderPercent =
    $("#loader-percent");

  const loaderStatus =
    $("#loader-status");

  const openBook =
    $("#open-book");

  openBook.disabled = true;

  let concluidas = 0;
  let falhas = 0;

  /*
    A porcentagem inicial considera apenas
    a capa e as imagens da memória do passado.

    Essas são as imagens necessárias
    para começar a experiência sem travar.
  */

  const total =
    imagensCriticas.length;

  function atualizarProgresso(
    resultado
  ) {
    concluidas += 1;

    if (
      !resultado.carregou
    ) {
      falhas += 1;
    }

    const porcentagem =
      Math.round(
        (
          concluidas /
          total
        ) *
        100
      );

    loaderBar.style.width =
      `${porcentagem}%`;

    loaderPercent.textContent =
      `${porcentagem}%`;

    if (
      porcentagem < 25
    ) {
      loaderStatus.textContent =
        "Preparando a capa...";
    } else if (
      porcentagem < 55
    ) {
      loaderStatus.textContent =
        "Abrindo as primeiras memórias...";
    } else if (
      porcentagem < 85
    ) {
      loaderStatus.textContent =
        "Preparando o passado...";
    } else {
      loaderStatus.textContent =
        "Quase pronto...";
    }
  }

  /*
    Somente duas imagens são baixadas ao mesmo tempo.

    Isso é mais estável em celulares
    e conexões mais lentas.
  */

  await carregarImagensEmFila(
    imagensCriticas,
    2,
    atualizarProgresso
  );

  loaderBar.style.width =
    "100%";

  loaderPercent.textContent =
    "100%";

  if (
    falhas > 0
  ) {
    loaderStatus.textContent =
      "Algumas imagens iniciais não foram encontradas.";

    console.warn(
      `${falhas} imagem(ns) inicial(is) não foram carregadas.`
    );

    await wait(
      1500
    );
  } else {
    loaderStatus.textContent =
      "Memórias prontas.";

    await wait(
      850
    );
  }

  /*
    Agora o livro pode ser exibido.

    As imagens do passado continuam guardadas
    em elementos de imagem fora da tela,
    prontas para serem usadas.
  */

  openBook.disabled = false;

  document.body.classList.remove(
    "loading"
  );

  requestAnimationFrame(
    () => {
      document.body.classList.add(
        "ready"
      );
    }
  );

  loader.classList.add(
    "leaving"
  );

  await wait(
    1200
  );

  loader.remove();

  /*
    Depois que a capa já apareceu,
    as próximas cenas começam a ser preparadas.

    Isso acontece enquanto a pessoa abre o livro
    e acompanha a primeira parte da história.
  */

  carregarRestanteEmSegundoPlano()
    .catch(
      (error) => {
        console.warn(
          "Algumas imagens posteriores não foram preparadas.",
          error
        );
      }
    );

  /*
    A música começa a ser preparada depois,
    para não disputar internet com as imagens iniciais.
  */

  setTimeout(
    () => {
      prepararMusicasEmSegundoPlano();
    },
    1800
  );
}

iniciarCarregamentoInicial()
  .catch(
    (error) => {
      console.error(
        "Erro no carregamento inicial:",
        error
      );

      const openBook =
        $("#open-book");

      openBook.disabled = false;

      document.body.classList.remove(
        "loading"
      );

      document.body.classList.add(
        "ready"
      );

      $("#asset-loader")
        ?.remove();

      carregarRestanteEmSegundoPlano()
        .catch(
          () => {}
        );

      prepararMusicasEmSegundoPlano();
    }
  );
/* PARTÍCULAS */

function criarParticulas() {
  const layer =
    $("#ambient-particles");

  for (
    let index = 0;
    index < 34;
    index += 1
  ) {
    const particle =
      document.createElement(
        "span"
      );

    particle.style.left =
      `${Math.random() * 100}%`;

    particle.style.setProperty(
      "--duration",
      `${12 + Math.random() * 18}s`
    );

    particle.style.setProperty(
      "--delay",
      `${Math.random() * -25}s`
    );

    particle.style.setProperty(
      "--drift",
      `${-70 + Math.random() * 140}px`
    );

    layer.appendChild(
      particle
    );
  }
}

criarParticulas();

/* TRANSIÇÕES */

async function efeitoDeMemoria() {
  const wash =
    $("#memory-wash");

  gsap.set(
    wash,
    {
      visibility: "visible",
      opacity: 0,
      scale: 0.1,
      rotation: -15
    }
  );

  await tween(
    wash,
    {
      opacity: 0.6,
      scale: 0.9,
      rotation: 8,
      duration: 1.5,
      ease: "power2.in"
    }
  );

  await tween(
    wash,
    {
      opacity: 0,
      scale: 1.8,
      rotation: 25,
      duration: 2.3,
      ease: "power2.out"
    }
  );

  gsap.set(
    wash,
    {
      visibility: "hidden"
    }
  );
}

async function changeScene(
  current,
  next
) {
  const memoryEffect =
    efeitoDeMemoria();

  await tween(
    current,
    {
      opacity: 0,
      duration: 2.2,
      ease: "power1.inOut"
    }
  );

  gsap.set(
    current,
    {
      visibility: "hidden",
      display: "none"
    }
  );

  gsap.set(
    next,
    {
      display: "block",
      visibility: "visible",
      opacity: 0
    }
  );

  await tween(
    next,
    {
      opacity: 1,
      duration: 3,
      ease: "power1.inOut"
    }
  );

  await memoryEffect;
}

async function showChapter(
  element
) {
  await fromTo(
    element,
    {
      opacity: 0,
      y: 14,
      letterSpacing: "10px"
    },
    {
      opacity: 1,
      y: 0,
      letterSpacing: "2px",
      duration: 2,
      ease: "power1.out"
    }
  );

  await wait(
    TEMPO_TITULO
  );

  await tween(
    element,
    {
      opacity: 0,
      y: -10,
      duration: 1.3,
      ease: "power1.in"
    }
  );
}

function calcularTempoDeLeitura(
  item
) {
  const tempoDefinido =
    (
      item.time ??
      3400
    ) *
    MULTIPLICADOR_LEITURA;

  const tempoPeloTamanho =
    2200 +
    item.text.length * 48;

  return Math.max(
    tempoDefinido,
    tempoPeloTamanho
  );
}

async function mostrarFrase(
  item,
  element
) {
  element.textContent =
    item.text;

  await fromTo(
    element,
    {
      opacity: 0,
      y: 15,
      filter: "blur(5px)"
    },
    {
      opacity: 1,
      y: 0,
      filter: "blur(0px)",
      duration: 1.25,
      ease: "power1.out"
    }
  );

  await wait(
    calcularTempoDeLeitura(
      item
    )
  );

  await tween(
    element,
    {
      opacity: 0,
      y: -10,
      filter: "blur(4px)",
      duration: 1,
      ease: "power1.in"
    }
  );
}

async function narrate(
  lines,
  element,
  onLine
) {
  for (
    let index = 0;
    index < lines.length;
    index += 1
  ) {
    const item =
      typeof lines[index] === "string"
        ? {
            text: lines[index],
            time: 3400
          }
        : lines[index];

    if (onLine) {
      onLine(index);
    }

    await mostrarFrase(
      item,
      element
    );
  }
}

function pulse(
  target,
  scale = 1.07,
  duration = 1.8
) {
  gsap.to(
    target,
    {
      scale,
      duration,
      repeat: -1,
      yoyo: true,
      ease: "sine.inOut"
    }
  );
}

/* CENAS */

const scenes = {
  opening: $("#opening"),
  past: $("#past"),
  gate: $("#memory-gate"),
  casino: $("#casino"),
  match: $("#match"),
  lawn: $("#lawn"),
  convergence: $("#convergence"),
  rain: $("#rain"),
  ritual: $("#ritual"),
  us: $("#us"),
  wedding: $("#wedding")
};

/* IMAGENS DO PASSADO */

const pastImages = {
  forest:
    $("#past-image-forest"),

  moon:
    $("#past-image-moon"),

  tragedy:
    $("#past-image-tragedy"),

  lonely:
    $("#past-image-lonely"),

  change:
    $("#past-image-change")
};

let currentPastImage =
  pastImages.forest;

function prepararImagemInicialDoPassado() {
  Object.values(
    pastImages
  ).forEach(
    (image) => {
      gsap.killTweensOf(
        image
      );

      gsap.set(
        image,
        {
          opacity: 0,
          visibility: "hidden",
          scale: 1.025
        }
      );

      image.classList.remove(
        "active"
      );
    }
  );

  currentPastImage =
    pastImages.forest;

  currentPastImage.classList.add(
    "active"
  );

  gsap.set(
    currentPastImage,
    {
      opacity: 1,
      visibility: "visible",
      scale: 1.025
    }
  );

  gsap.to(
    currentPastImage,
    {
      scale: 1,
      duration: 23,
      ease: "none"
    }
  );
}

async function trocarImagemDoPassado(
  imageName
) {
  const nextImage =
    pastImages[imageName];

  if (
    !nextImage ||
    nextImage === currentPastImage
  ) {
    return;
  }

  const previousImage =
    currentPastImage;

  currentPastImage =
    nextImage;

  gsap.killTweensOf(
    previousImage
  );

  gsap.killTweensOf(
    nextImage
  );

  nextImage.classList.add(
    "active"
  );

  gsap.set(
    nextImage,
    {
      visibility: "visible",
      opacity: 0,
      scale: 1.025
    }
  );

  await Promise.all([
    tween(
      previousImage,
      {
        opacity: 0,
        scale: 1,
        duration: 3.4,
        ease: "power1.inOut"
      }
    ),

    tween(
      nextImage,
      {
        opacity: 1,
        scale: 1.015,
        duration: 3.4,
        ease: "power1.inOut"
      }
    )
  ]);

  previousImage.classList.remove(
    "active"
  );

  gsap.set(
    previousImage,
    {
      visibility: "hidden"
    }
  );

  gsap.to(
    nextImage,
    {
      scale: 1,
      duration: 20,
      ease: "none"
    }
  );

  await wait(900);
}

/* IMAGENS DO CASSINO */

const casinoImages = {
  observing:
    $("#casino-observando"),

  greeting:
    $("#casino-conversa")
};

let currentCasinoImage =
  casinoImages.observing;

async function trocarImagemCassino(
  imageName
) {
  const nextImage =
    casinoImages[imageName];

  if (
    !nextImage ||
    nextImage === currentCasinoImage
  ) {
    return;
  }

  const previousImage =
    currentCasinoImage;

  currentCasinoImage =
    nextImage;

  gsap.set(
    nextImage,
    {
      visibility: "visible",
      opacity: 0,
      scale: 1.02
    }
  );

  nextImage.classList.add(
    "active"
  );

  await Promise.all([
    tween(
      previousImage,
      {
        opacity: 0,
        duration: 2.8,
        ease: "power1.inOut"
      }
    ),

    tween(
      nextImage,
      {
        opacity: 1,
        duration: 2.8,
        ease: "power1.inOut"
      }
    )
  ]);

  previousImage.classList.remove(
    "active"
  );

  gsap.set(
    previousImage,
    {
      visibility: "hidden"
    }
  );

  await wait(700);
}

/* TEXTOS */

const pastLines = [
  {
    text:
      "Morgana...",

    time:
      1900,

    image:
      "forest"
  },

  {
    text:
      "Antes de te mostrar algumas das minhas memórias, existe uma parte da minha história que você ainda não conhece.",

    time:
      4400,

    image:
      "forest"
  },

  {
    text:
      "Quando eu era adolescente, fui a uma festa na floresta com outros jovens. Meu irmão mais velho também estava lá.",

    time:
      5300,

    image:
      "forest"
  },

  {
    text:
      "Era para ter sido apenas uma noite comum. Uma daquelas noites em que ninguém imagina que tudo está prestes a mudar.",

    time:
      5100,

    image:
      "forest"
  },

  {
    text:
      "Mas, no meio daquela festa, a lua cheia surgiu entre as árvores.",

    time:
      4400,

    image:
      "moon"
  },

  {
    text:
      "Eu me transformei e perdi totalmente o controle de mim.",

    time:
      4700,

    image:
      "moon"
  },

  {
    text:
      "Quando voltei a mim, a festa havia se transformado em uma tragédia.",

    time:
      4500,

    image:
      "tragedy"
  },

  {
    text:
      "Eu havia matado todos que estavam ali... inclusive o meu irmão mais velho.",

    time:
      5200,

    image:
      "tragedy"
  },

  {
    text:
      "Depois disso, decidi ser solitário, acreditando que ficar longe era a única forma de não ferir mais ninguém.",

    time:
      5400,

    image:
      "lonely"
  },

  {
    text:
      "Mas o tempo passou. Eu cresci, mudei e aprendi que o passado não precisa decidir quem seremos para sempre.",

    time:
      5400,

    image:
      "change"
  },

  {
    text:
      "Nós podemos mudar, aprender, nos perdoar e escolher quem queremos ser daqui para frente.",

    time:
      5000,

    image:
      "change"
  },

  {
    text:
      "Agora que você encontrou as suas memórias, eu quero te mostrar algumas das minhas.",

    time:
      4800,

    image:
      "change"
  },

  {
    text:
      "Porque, em algum momento, Morgana... as minhas memórias favoritas começaram a ter você.",

    time:
      5600,

    image:
      "change"
  }
];

const casinoLines = [
  {
    text:
      "Antes mesmo de existir um nós, existia você.",

    time:
      3900,

    image:
      "observing"
  },

  {
    text:
      "Eu te via algumas vezes pelo cassino e, desde o começo, você sempre chamou a minha atenção.",

    time:
      4700,

    image:
      "observing"
  },

  {
    text:
      "Às vezes eu apenas observava você de longe, sem saber como atravessar aquela distância.",

    time:
      4700,

    image:
      "observing"
  },

  {
    text:
      "Alguma coisa me dizia que o seu coração já pertencia a alguém.",

    time:
      4300,

    image:
      "observing"
  },

  {
    text:
      "Algumas vezes nossos caminhos se cruzavam dentro do cassino.",

    time:
      4200,

    image:
      "greeting"
  },

  {
    text:
      "A gente se cumprimentava e, por muito tempo, isso foi tudo.",

    time:
      4300,

    image:
      "greeting"
  },

  {
    text:
      "Eu ainda não sabia que estava deixando passar pela minha frente a pessoa que se tornaria o meu lugar favorito no mundo.",

    time:
      5500,

    image:
      "greeting"
  }
];

const lawnLines = [
  {
    text:
      "E então você me chamou para conversar.",

    time:
      3900
  },

  {
    text:
      "Ficamos sentados perto do cassino até bem tarde da noite.",

    time:
      4500
  },

  {
    text:
      "Falamos sobre tudo e, de algum jeito, conversar com você parecia tão fácil.",

    time:
      4700
  },

  {
    text:
      "Era confortável. Era como se tudo estivesse começando a se encaixar.",

    time:
      4600
  },

  {
    text:
      "Naquela noite, eu não queria ir embora.",

    time:
      4100
  }
];

const convergenceLines = [
  {
    text:
      "Depois daquela noite, começamos a nos ver todos os dias.",

    time:
      4300
  },

  {
    text:
      "Cada encontro fazia parecer que você já fazia parte da minha vida.",

    time:
      4600
  },

  {
    text:
      "Mas nem todos os nossos dias foram tranquilos.",

    time:
      3900
  },

  {
    text:
      "Nos dias de Convergência, tudo podia mudar em apenas alguns segundos.",

    time:
      4700
  },

  {
    text:
      "Eu quase não voltei.",

    time:
      3500
  },

  {
    text:
      "E, por um instante, quase ficamos sem um ao outro.",

    time:
      4200
  },

  {
    text:
      "Foi ali que eu entendi o quanto tinha medo de viver em um mundo onde você não estivesse.",

    time:
      5300
  }
];

const rainBefore = [
  {
    text:
      "Depois de tantos sustos, veio uma noite que eu nunca mais esqueci.",

    time:
      4600
  },

  {
    text:
      "Estávamos com a sua família na piscina dos apartamentos.",

    time:
      4300
  },

  {
    text:
      "Tudo parecia tranquilo... até que começou a chover.",

    time:
      4300
  },

  {
    text:
      "Nós nos afastamos um pouco, procurando um canto que fosse apenas nosso.",

    time:
      4600
  },

  {
    text:
      "E foi ali que você disse, pela primeira vez, que me amava.",

    time:
      5000
  }
];

const rainAfter = [
  {
    text:
      "Talvez eu já te amasse havia mais tempo do que conseguia admitir.",

    time:
      4600
  },

  {
    text:
      "Então nós dançamos na chuva.",

    time:
      3900
  },

  {
    text:
      "Sem música. Sem medo. Como se o mundo inteiro tivesse parado para nos assistir.",

    time:
      5000
  },

  {
    text:
      "Ali, com você nos meus braços, eu soube que não queria mais chamar aquilo apenas de acaso.",

    time:
      5200
  },

  {
    text:
      "Eu queria que aquilo tivesse um nome.",

    time:
      3900
  }
];

const ritualLines = [
  {
    text:
      "Depois daquele sim, vieram dias que passaram a ter o seu nome.",

    time:
      4500
  },

  {
    text:
      "Mas ainda existia uma parte de você que continuava perdida.",

    time:
      4300
  },

  {
    text:
      "Quando chegou o momento de recuperar as suas memórias, eu sabia que aquilo poderia machucar.",

    time:
      5100
  },

  {
    text:
      "Eu não podia entrar no lugar que existia dentro da sua mente.",

    time:
      4500
  },

  {
    text:
      "Mas podia permanecer do lado de fora, esperando você voltar.",

    time:
      4500
  },

  {
    text:
      "Podia segurar a sua mão e lembrar que você não precisaria enfrentar aquilo sozinha.",

    time:
      5100
  },

  {
    text:
      "Então, pouco a pouco, os fragmentos começaram a voltar.",

    time:
      4500
  }
];

const usLines = [
  {
    text:
      "Depois daquele ritual, não foi o passado que ficou entre nós.",

    time:
      4500
  },

  {
    text:
      "Foi a certeza de que nenhuma verdade seria capaz de me fazer ir embora.",

    time:
      4800
  },

  {
    text:
      "E então continuamos.",

    time:
      3500
  },

  {
    text:
      "Entre risadas, sustos, noites longas e dias simples.",

    time:
      4200
  },

  {
    text:
      "Sem perceber, fomos transformando momentos em uma vida.",

    time:
      4500
  },

  {
    text:
      "Porque amar você nunca esteve apenas nas grandes declarações.",

    time:
      4500
  },

  {
    text:
      "Esteve em cada pequena escolha de ficar.",

    time:
      4100
  }
];

const weddingLines = [
  {
    text:
      "Morgana... depois de todas essas memórias, ainda existe algo que eu preciso te dizer.",

    time:
      5100
  },

  {
    text:
      "Eu não posso prometer uma vida sem tempestades, sem medo ou sem dias difíceis.",

    time:
      5200
  },

  {
    text:
      "Mas posso prometer que, em cada uma delas, vou escolher ficar ao seu lado.",

    time:
      5200
  },

  {
    text:
      "Quero continuar encontrando você em todas as minhas memórias favoritas.",

    time:
      4700
  },

  {
    text:
      "Quero construir com você todas aquelas que ainda nem existem.",

    time:
      4700
  },

  {
    text:
      "Quero ser o seu lar, assim como você se tornou o meu.",

    time:
      4800
  },

  {
    text:
      "Por isso, a última página deste livro não termina aqui na tela.",

    time:
      5000
  },

  {
    text:
      "Ela está bem atrás de você.",

    time:
      4300
  }
];

/* PASSADO */

async function narrarPassado() {
  let imagemAtual =
    "forest";

  for (
    let index = 0;
    index < pastLines.length;
    index += 1
  ) {
    const item =
      pastLines[index];

    if (
      item.image !==
      imagemAtual
    ) {
      await trocarImagemDoPassado(
        item.image
      );

      imagemAtual =
        item.image;
    }

    if (index === 9) {
      gsap.to(
        "#past-glow",
        {
          opacity: 0.48,
          scale: 1.1,
          duration: 4.5
        }
      );
    }

    await mostrarFrase(
      item,
      $("#past-text")
    );
  }
}

/* CASSINO */

async function narrarCassino() {
  let imagemAtual =
    "observing";

  for (
    const item of casinoLines
  ) {
    if (
      item.image !==
      imagemAtual
    ) {
      await trocarImagemCassino(
        item.image
      );

      imagemAtual =
        item.image;
    }

    await mostrarFrase(
      item,
      $("#casino-text")
    );
  }
}

/* ABERTURA */

let started = false;

$("#open-book").addEventListener(
  "click",
  async () => {
    if (started) {
      return;
    }

    started = true;

    iniciarMusicaTriste();

    const button =
      $("#open-book");

    const book =
      $("#book");

    const cover =
      $("#book-cover");

    const page =
      $("#page-line");

    button.disabled = true;

    await tween(
      button,
      {
        opacity: 0,
        y: 15,
        duration: 0.9
      }
    );

    await tween(
      ".opening-note",
      {
        opacity: 0,
        duration: 0.8
      }
    );

    await tween(
      book,
      {
        scale: 1.1,
        y: -16,
        rotationY: 2,
        duration: 1.9,
        ease: "power1.inOut"
      }
    );

    await tween(
      cover,
      {
        rotationY: -178,
        duration: 3.4,
        ease: "power2.inOut"
      }
    );

    await tween(
      page,
      {
        opacity: 1,
        duration: 1.7
      }
    );

    await wait(4500);

    await tween(
      page,
      {
        opacity: 0,
        duration: 1.15
      }
    );

    page.textContent = "";

    gsap.set(
      page,
      {
        display: "none"
      }
    );

    await wait(1400);

    prepararImagemInicialDoPassado();

    gsap.set(
      scenes.past,
      {
        display: "block",
        visibility: "visible",
        opacity: 0,
        zIndex: 1
      }
    );

    gsap.set(
      book,
      {
        transformOrigin: "50% 50%"
      }
    );

    const timeline =
      gsap.timeline();

    timeline.to(
      book,
      {
        scale: 7.8,
        x: -8,
        y: 4,
        rotationX: 0,
        rotationY: 0,
        duration: 5.2,
        ease: "power2.inOut"
      },
      0
    );

    timeline.to(
      cover,
      {
        opacity: 0,
        duration: 1.8,
        ease: "power1.inOut"
      },
      1
    );

    timeline.to(
      ".book-back, .book-page-stack",
      {
        opacity: 0,
        duration: 1.8,
        ease: "power1.inOut"
      },
      1.3
    );

    timeline.to(
      scenes.past,
      {
        opacity: 1,
        duration: 3.3,
        ease: "power1.inOut"
      },
      4.1
    );

    timeline.to(
      scenes.opening,
      {
        opacity: 0,
        duration: 3.3,
        ease: "power1.inOut"
      },
      4.1
    );

    await new Promise(
      (resolve) => {
        timeline.eventCallback(
          "onComplete",
          resolve
        );
      }
    );

    gsap.set(
      scenes.opening,
      {
        display: "none",
        visibility: "hidden",
        zIndex: "auto"
      }
    );

    gsap.set(
      scenes.past,
      {
        opacity: 1,
        zIndex: "auto"
      }
    );

    await wait(1800);

    await narrarPassado();

    await changeScene(
      scenes.past,
      scenes.gate
    );

    gsap.to(
      ".memory-dots i",
      {
        opacity: 0.65,
        duration: 2.4,
        stagger: 0.28
      }
    );

    gsap.to(
      "#memory-question, #remember, .memory-gate .center-stack small",
      {
        opacity: 1,
        duration: 2.1,
        stagger: 0.5
      }
    );

    pulse(
      "#remember",
      1.06,
      2.4
    );
  }
);

/* PORTAL */

let remembered = false;

async function openCasino() {
  if (remembered) {
    return;
  }

  remembered = true;

  iniciarPrimeiraMusicaRomantica();

  gsap.killTweensOf(
    "#remember"
  );

  await changeScene(
    scenes.gate,
    scenes.casino
  );

  await showChapter(
    $("#casino-title")
  );

  await narrarCassino();

  await openMatch();
}

$("#remember").addEventListener(
  "click",
  openCasino
);

window.addEventListener(
  "pointerup",
  (event) => {
    const gateStyle =
      getComputedStyle(
        scenes.gate
      );

    if (
      gateStyle.visibility !== "visible" ||
      remembered
    ) {
      return;
    }

    const rectangle =
      $("#remember")
        .getBoundingClientRect();

    const inside =
      event.clientX >= rectangle.left &&
      event.clientX <= rectangle.right &&
      event.clientY >= rectangle.top &&
      event.clientY <= rectangle.bottom;

    if (inside) {
      openCasino();
    }
  },
  true
);

/* TINDER */

async function openMatch() {
  await changeScene(
    scenes.casino,
    scenes.match
  );

  const timeText =
    $("#time-text");

  const transitions = [
    "O tempo passou.",

    "Por um tempo, eu fiquei longe da cidade.",

    "Até que um dia eu voltei... e nossos caminhos se cruzaram outra vez."
  ];

  for (
    const text of transitions
  ) {
    timeText.textContent =
      text;

    await fromTo(
      timeText,
      {
        opacity: 0,
        y: 15,
        filter: "blur(5px)"
      },
      {
        opacity: 1,
        y: 0,
        filter: "blur(0px)",
        duration: 1.4
      }
    );

    await wait(
      TEMPO_TRANSICAO_TEXTO
    );

    await tween(
      timeText,
      {
        opacity: 0,
        y: -10,
        duration: 1.1
      }
    );
  }

  gsap.set(
    "#tinder-jasper",
    {
      visibility: "visible"
    }
  );

  await tween(
    "#tinder-jasper",
    {
      opacity: 1,
      duration: 2.5
    }
  );

  gsap.set(
    "#heart",
    {
      visibility: "visible"
    }
  );

  await tween(
    "#heart",
    {
      opacity: 1,
      duration: 1
    }
  );

  pulse(
    "#heart",
    1.08,
    2
  );
}

let matchStage = 0;
let matchProcessing = false;

$("#heart").addEventListener(
  "click",
  async () => {
    if (matchProcessing) {
      return;
    }

    matchProcessing = true;

    gsap.killTweensOf(
      "#heart"
    );

    gsap.fromTo(
      "#heart",
      {
        scale: 0.85
      },
      {
        scale: 1.18,
        repeat: 1,
        yoyo: true,
        duration: 0.35
      }
    );

    if (matchStage === 0) {
      await tween(
        "#heart",
        {
          opacity: 0,
          duration: 0.7
        }
      );

      await tween(
        "#tinder-jasper",
        {
          opacity: 0,
          duration: 1.3
        }
      );

      gsap.set(
        "#tinder-jasper",
        {
          visibility: "hidden"
        }
      );

      await wait(500);

      gsap.set(
        "#tinder-morgana",
        {
          visibility: "visible"
        }
      );

      await tween(
        "#tinder-morgana",
        {
          opacity: 1,
          duration: 2
        }
      );

      await tween(
        "#heart",
        {
          opacity: 1,
          duration: 0.9
        }
      );

      pulse(
        "#heart",
        1.08,
        2
      );

      matchStage = 1;
      matchProcessing = false;

      return;
    }

    matchStage = 2;

    await tween(
      "#heart",
      {
        opacity: 0,
        duration: 0.7
      }
    );

    gsap.set(
      "#heart",
      {
        visibility: "hidden"
      }
    );

    await tween(
      "#tinder-morgana",
      {
        opacity: 0.2,
        duration: 1.2
      }
    );

    gsap.set(
      "#match-result",
      {
        visibility: "visible"
      }
    );

    await fromTo(
      "#match-result",
      {
        opacity: 0,
        scale: 0.85,
        filter: "blur(8px)"
      },
      {
        opacity: 1,
        scale: 1,
        filter: "blur(0px)",
        duration: 1.8
      }
    );

    await wait(3300);

    await tween(
      "#match-result",
      {
        opacity: 0,
        duration: 1.1
      }
    );

    gsap.set(
      "#match-result",
      {
        visibility: "hidden"
      }
    );

    await tween(
      "#tinder-morgana",
      {
        opacity: 0.7,
        duration: 1.2
      }
    );

    await tween(
      "#match-line",
      {
        opacity: 1,
        duration: 1.3
      }
    );

    await wait(4100);

    await tween(
      "#match-line",
      {
        opacity: 0,
        duration: 1
      }
    );

    await tween(
      "#message",
      {
        opacity: 1,
        duration: 1.1
      }
    );

    await wait(3000);

    gsap.set(
      "#open-chat",
      {
        visibility: "visible"
      }
    );

    await tween(
      "#open-chat",
      {
        opacity: 1,
        duration: 1.1
      }
    );

    matchProcessing = false;
  }
);

/* INTERAÇÕES */

function showGame(
  container,
  items
) {
  gsap.set(
    container,
    {
      visibility: "visible"
    }
  );

  gsap.to(
    container,
    {
      opacity: 1,
      duration: 1.8
    }
  );

  $$(items).forEach(
    (
      item,
      index
    ) => {
      gsap.to(
        item,
        {
          scale: 1.1,

          y:
            index % 2
              ? 9
              : -9,

          rotation:
            index % 2
              ? 4
              : -4,

          duration:
            2.1 +
            index * 0.25,

          repeat: -1,
          yoyo: true,

          ease: "sine.inOut"
        }
      );
    }
  );
}

function setupCollection(
  selector,
  countSelector,
  revealSelector,
  total,
  noun,
  done
) {
  let count = 0;

  $$(selector).forEach(
    (button) =>
      button.addEventListener(
        "click",
        async () => {
          if (
            button.classList.contains(
              "used"
            )
          ) {
            return;
          }

          button.classList.add(
            "used"
          );

          gsap.killTweensOf(
            button
          );

          gsap.to(
            button,
            {
              scale: 2,
              opacity: 0,
              duration: 0.85
            }
          );

          count += 1;

          $(countSelector)
            .textContent =
              `${count} de ${total} ${noun} encontrados`;

          const reveal =
            $(revealSelector);

          reveal.textContent =
            button.dataset.text;

          await fromTo(
            reveal,
            {
              opacity: 0,
              y: 14,
              filter: "blur(5px)"
            },
            {
              opacity: 1,
              y: 0,
              filter: "blur(0px)",
              duration: 1
            }
          );

          if (count === total) {
            await wait(4200);
            done();
          }
        }
      )
  );
}

/* ENCONTRO */

$("#open-chat").addEventListener(
  "click",
  async () => {
    await changeScene(
      scenes.match,
      scenes.lawn
    );

    await showChapter(
      $("#lawn-title")
    );

    await narrate(
      lawnLines,
      $("#lawn-text")
    );

    showGame(
      "#star-game",
      ".lawn .collect"
    );
  }
);

setupCollection(
  ".lawn .collect",
  "#star-count",
  "#star-reveal",
  3,
  "pensamentos",
  async () => {
    await tween(
      "#star-game",
      {
        opacity: 0,
        duration: 1.4
      }
    );

    gsap.set(
      "#star-game",
      {
        display: "none"
      }
    );

    gsap.set(
      "#lawn-ending",
      {
        visibility: "visible"
      }
    );

    await fromTo(
      "#lawn-ending",
      {
        opacity: 0,
        scale: 0.96
      },
      {
        opacity: 1,
        scale: 1,
        duration: 2
      }
    );
  }
);

/* QUASE */

let lightHeld = false;

$("#to-convergence")
  .addEventListener(
    "click",
    async () => {
      lightHeld = false;

      const holdLight =
        $("#hold-light");

      holdLight.disabled = false;

      gsap.killTweensOf(
        holdLight
      );

      gsap.set(
        holdLight,
        {
          pointerEvents: "auto",
          scale: 1
        }
      );

      gsap.set(
        "#hold-light span",
        {
          scale: 1,
          opacity: 1
        }
      );

      gsap.set(
        "#light-action",
        {
          display: "flex",
          visibility: "hidden",
          opacity: 0,
          pointerEvents: "auto"
        }
      );

      gsap.set(
        "#convergence-ending",
        {
          display: "block",
          visibility: "hidden",
          opacity: 0
        }
      );

      gsap.set(
        "#convergence-photo",
        {
          visibility: "visible",
          opacity: 1,
          scale: 1.02
        }
      );

      gsap.set(
        "#convergence-photo-2",
        {
          visibility: "hidden",
          opacity: 0,
          scale: 1.02
        }
      );

      gsap.set(
        "#darkness",
        {
          opacity: 0
        }
      );

      gsap.set(
        ".wine-particles",
        {
          opacity: 0
        }
      );

      iniciarSegundaMusicaRomantica()
        .catch(() => {
          console.warn(
            "A memória continuará mesmo sem a musicaromantica2.mp3."
          );
        });

      await changeScene(
        scenes.lawn,
        scenes.convergence
      );

      gsap.to(
        "#convergence-photo",
        {
          scale: 1,
          duration: 18,
          ease: "none"
        }
      );

      await showChapter(
        $("#convergence-title")
      );

      await tween(
        "#convergence-couple",
        {
          opacity: 0.15,
          duration: 2.2
        }
      );

      await narrate(
        convergenceLines,
        $("#convergence-text"),
        (index) => {
          if (index === 4) {
            gsap.to(
              "#conv-jasper",
              {
                y: 52,
                rotation: 70,
                opacity: 0.45,
                duration: 2
              }
            );
          }

          if (index === 5) {
            gsap.set(
              "#convergence-photo-2",
              {
                visibility: "visible",
                opacity: 0,
                scale: 1.02
              }
            );

            gsap.to(
              "#convergence-photo",
              {
                opacity: 0,
                scale: 1,
                duration: 3,
                ease: "power1.inOut",

                onComplete: () => {
                  gsap.set(
                    "#convergence-photo",
                    {
                      visibility: "hidden"
                    }
                  );
                }
              }
            );

            gsap.to(
              "#convergence-photo-2",
              {
                opacity: 1,
                scale: 1,
                duration: 3,
                ease: "power1.inOut"
              }
            );

            gsap.to(
              "#conv-morgana",
              {
                x: -65,
                duration: 2.5
              }
            );

            gsap.to(
              ".wine-particles",
              {
                opacity: 0.32,
                duration: 2.5
              }
            );
          }

          if (index === 6) {
            gsap.to(
              "#darkness",
              {
                opacity: 0.65,
                duration: 2.5
              }
            );
          }
        }
      );

      gsap.set(
        "#light-action",
        {
          display: "flex",
          visibility: "visible",
          opacity: 0,
          pointerEvents: "auto",
          zIndex: 500
        }
      );

      gsap.set(
        "#hold-light",
        {
          pointerEvents: "auto",
          zIndex: 510
        }
      );

      await tween(
        "#light-action",
        {
          opacity: 1,
          duration: 1.8
        }
      );

      pulse(
        "#hold-light",
        1.07,
        2.2
      );
    }
  );

async function segurarLuz() {
  if (lightHeld) {
    return;
  }

  lightHeld = true;

  const lightAction =
    $("#light-action");

  const holdLight =
    $("#hold-light");

  gsap.killTweensOf(
    holdLight
  );

  holdLight.disabled = true;

  gsap.set(
    holdLight,
    {
      pointerEvents: "none"
    }
  );

  gsap.to(
    "#hold-light span",
    {
      scale: 18,
      opacity: 0,
      duration: 1.5
    }
  );

  await tween(
    lightAction,
    {
      opacity: 0,
      duration: 1.1
    }
  );

  gsap.set(
    lightAction,
    {
      visibility: "hidden",
      display: "none",
      pointerEvents: "none"
    }
  );

  gsap.to(
    "#darkness",
    {
      opacity: 0,
      duration: 1.7
    }
  );

  gsap.to(
    ".wine-particles",
    {
      opacity: 0.05,
      duration: 2
    }
  );

  await tween(
    "#conv-jasper",
    {
      y: 0,
      rotation: 0,
      opacity: 0.9,
      duration: 2.3
    }
  );

  gsap.set(
    "#convergence-ending",
    {
      visibility: "visible",
      display: "block",
      pointerEvents: "auto"
    }
  );

  await fromTo(
    "#convergence-ending",
    {
      opacity: 0,
      scale: 0.96
    },
    {
      opacity: 1,
      scale: 1,
      duration: 2
    }
  );
}

$("#hold-light").addEventListener(
  "click",
  (event) => {
    event.preventDefault();
    event.stopPropagation();

    segurarLuz();
  }
);

/* A CHUVA */

$("#to-rain").addEventListener(
  "click",
  async () => {
    gsap.set(
      "#rain-proposal-image",
      {
        visibility: "visible",
        opacity: 1,
        scale: 1
      }
    );

    await changeScene(
      scenes.convergence,
      scenes.rain
    );

    await showChapter(
      $("#rain-title")
    );

    await narrate(
      rainBefore,
      $("#rain-text")
    );

    gsap.set(
      "#love-action",
      {
        display: "flex",
        visibility: "visible",
        opacity: 0
      }
    );

    await tween(
      "#love-action",
      {
        opacity: 1,
        duration: 1.8
      }
    );

    pulse(
      "#answer-love",
      1.08,
      2
    );
  }
);

$("#answer-love").addEventListener(
  "click",
  async () => {
    gsap.killTweensOf(
      "#answer-love"
    );

    await tween(
      "#love-action",
      {
        opacity: 0,
        duration: 1
      }
    );

    gsap.set(
      "#love-action",
      {
        display: "none",
        visibility: "hidden"
      }
    );

    gsap.set(
      "#love-answer",
      {
        visibility: "visible"
      }
    );

    await fromTo(
      "#love-answer",
      {
        opacity: 0,
        scale: 0.85
      },
      {
        opacity: 1,
        scale: 1,
        duration: 1.6
      }
    );

    await wait(3400);

    await tween(
      "#love-answer",
      {
        opacity: 0,
        duration: 1
      }
    );

    await narrate(
      rainAfter,
      $("#rain-text")
    );

    gsap.set(
      "#dating-proposal",
      {
        visibility: "visible"
      }
    );

    await fromTo(
      "#dating-proposal",
      {
        opacity: 0,
        scale: 0.95
      },
      {
        opacity: 1,
        scale: 1,
        duration: 1.9
      }
    );

    pulse(
      "#remember-yes",
      1.04,
      2
    );
  }
);

$("#remember-yes").addEventListener(
  "click",
  async () => {
    gsap.killTweensOf(
      "#remember-yes"
    );

    await tween(
      "#dating-proposal",
      {
        opacity: 0,
        duration: 1.1
      }
    );

    gsap.set(
      "#dating-proposal",
      {
        display: "none",
        visibility: "hidden"
      }
    );

    gsap.set(
      "#rain-ending",
      {
        visibility: "visible"
      }
    );

    await fromTo(
      "#rain-ending",
      {
        opacity: 0,
        scale: 0.96
      },
      {
        opacity: 1,
        scale: 1,
        duration: 2
      }
    );
  }
);

/* RITUAL */

$("#to-ritual").addEventListener(
  "click",
  async () => {
    await changeScene(
      scenes.rain,
      scenes.ritual
    );

    await showChapter(
      $("#ritual-title")
    );

    gsap.to(
      "#ritual-circle, .candles, #ritual-couple",
      {
        opacity: 1,
        duration: 2.4,
        stagger: 0.35
      }
    );

    gsap.to(
      "#ritual-circle",
      {
        rotationZ: 360,
        duration: 40,
        repeat: -1,
        ease: "none"
      }
    );

    await narrate(
      ritualLines,
      $("#ritual-text"),
      (index) => {
        if (index === 4) {
          gsap.to(
            "#ritual-jasper",
            {
              x: -20,
              opacity: 0.85,
              duration: 2.5
            }
          );
        }
      }
    );

    showGame(
      "#fragment-game",
      ".ritual .collect"
    );
  }
);

setupCollection(
  ".ritual .collect",
  "#fragment-count",
  "#fragment-reveal",
  4,
  "fragmentos",
  async () => {
    await tween(
      "#fragment-game",
      {
        opacity: 0,
        duration: 1.4
      }
    );

    gsap.set(
      "#fragment-game",
      {
        display: "none"
      }
    );

    gsap.set(
      "#ritual-ending",
      {
        visibility: "visible"
      }
    );

    await fromTo(
      "#ritual-ending",
      {
        opacity: 0,
        scale: 0.96
      },
      {
        opacity: 1,
        scale: 1,
        duration: 2.1
      }
    );
  }
);

/* NÓS */

$("#to-us").addEventListener(
  "click",
  async () => {
    iniciarTerceiraMusicaRomantica()
      .catch(() => {
        console.warn(
          "A memória Nós continuará mesmo sem a musicaromantica3.mp3."
        );
      });

    await changeScene(
      scenes.ritual,
      scenes.us
    );

    await showChapter(
      $("#us-title")
    );

    await narrate(
      usLines,
      $("#us-text"),
      (index) => {

        if (index === 6) {
          gsap.to(
            "#us-glow",
            {
              opacity: 0.72,
              scale: 1.1,
              duration: 2.5
            }
          );
        }
      }
    );

    showGame(
      "#moment-game",
      ".us .collect"
    );
  }
);

setupCollection(
  ".us .collect",
  "#moment-count",
  "#moment-reveal",
  5,
  "momentos",
  async () => {
    await tween(
      "#moment-game",
      {
        opacity: 0,
        duration: 1.4
      }
    );

    gsap.set(
      "#moment-game",
      {
        display: "none"
      }
    );

    gsap.set(
      "#us-ending",
      {
        visibility: "visible"
      }
    );

    await fromTo(
      "#us-ending",
      {
        opacity: 0,
        scale: 0.96
      },
      {
        opacity: 1,
        scale: 1,
        duration: 2.2
      }
    );

    pulse(
      "#last-page",
      1.04,
      2.1
    );
  }
);

/* BLOCO FINAL */

$("#last-page").addEventListener(
  "click",
  async () => {
    gsap.killTweensOf(
      "#last-page"
    );

    gsap.set(
      "#wedding-final-image",
      {
        opacity: 1,
        scale: 1.02
      }
    );

    await changeScene(
      scenes.us,
      scenes.wedding
    );

    gsap.to(
      "#wedding-final-image",
      {
        scale: 1,
        duration: 24,
        ease: "none"
      }
    );

    await narrate(
      weddingLines,
      $("#wedding-text")
    );

    gsap.set(
      "#wedding-question",
      {
        visibility: "visible",
        xPercent: -50,
        yPercent: -50
      }
    );

    await fromTo(
      "#wedding-question",
      {
        opacity: 0,
        scale: 0.96,
        filter: "blur(7px)"
      },
      {
        opacity: 1,
        scale: 1,
        filter: "blur(0px)",
        duration: 2.4
      }
    );

    pulse(
      "#turn-around",
      1.045,
      2.1
    );
  }
);

/* CAPA FINAL DO LIVRO */

let endingStarted = false;

$("#turn-around").addEventListener(
  "click",
  async () => {
    if (endingStarted) {
      return;
    }

    endingStarted = true;

    const turnAround =
      $("#turn-around");

    turnAround.disabled = true;

    gsap.killTweensOf(
      turnAround
    );

    /*
      Retira suavemente a mensagem final.
    */

    await tween(
      "#wedding-question",
      {
        opacity: 0,
        scale: 0.97,
        duration: 0.9,
        ease: "power1.inOut"
      }
    );

    gsap.set(
      "#wedding-question",
      {
        display: "none",
        visibility: "hidden"
      }
    );

    /*
      Faz a imagem do casal desaparecer.
    */

    await tween(
      "#wedding-final-image, .wedding-overlay",
      {
        opacity: 0,
        duration: 1.2,
        ease: "power1.inOut"
      }
    );

    /*
      A capa já fica completamente fechada.
      Não haverá mais animação das páginas.
    */

    gsap.set(
      "#closing-book-cover",
      {
        rotationY: 0,
        opacity: 1
      }
    );

    gsap.set(
      "#closing-book-pages, #closing-book-back",
      {
        opacity: 0
      }
    );

    gsap.set(
      "#closing-book",
      {
        display: "block",
        visibility: "visible",

        xPercent: -50,
        yPercent: -50,

        rotationX: 0,
        rotationY: 0,

        opacity: 0,
        scale: 0.86
      }
    );

    /*
      Escurece o fundo enquanto a capa final aparece.
    */

    await Promise.all([
      tween(
        "#final-darkness",
        {
          opacity: 0.88,
          duration: 1.7,
          ease: "power1.inOut"
        }
      ),

      tween(
        "#closing-book",
        {
          opacity: 1,
          scale: 1,
          duration: 1.7,
          ease: "power2.out"
        }
      )
    ]);

    /*
      Pequeno movimento final, bem suave.
    */

    await tween(
      "#closing-book",
      {
        scale: 0.97,
        duration: 2,
        ease: "sine.inOut"
      }
    );
  }
);