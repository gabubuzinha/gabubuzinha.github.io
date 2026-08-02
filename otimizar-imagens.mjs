import fs from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const pastaDoProjeto = process.cwd();

const pastaDeImagens = path.join(
  pastaDoProjeto,
  "public",
  "imagens"
);

const arquivosDoCodigo = [
  path.join(pastaDoProjeto, "index.html"),
  path.join(pastaDoProjeto, "src", "style.css"),
  path.join(pastaDoProjeto, "src", "main.js")
];

const extensoesPermitidas = [
  ".png",
  ".jpg",
  ".jpeg"
];

function formatarTamanho(bytes) {
  if (bytes < 1024) {
    return `${bytes} B`;
  }

  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(1)} KB`;
  }

  return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
}

async function converterImagem(nomeDoArquivo) {
  const extensao = path
    .extname(nomeDoArquivo)
    .toLowerCase();

  if (!extensoesPermitidas.includes(extensao)) {
    return null;
  }

  const nomeSemExtensao =
    path.basename(nomeDoArquivo, extensao);

  const entrada =
    path.join(pastaDeImagens, nomeDoArquivo);

  const nomeWebp =
    `${nomeSemExtensao}.webp`;

  const saida =
    path.join(pastaDeImagens, nomeWebp);

  const tamanhoOriginal =
    (await fs.stat(entrada)).size;

  const imagem =
    sharp(entrada, {
      limitInputPixels: false
    });

  const metadata =
    await imagem.metadata();

  /*
    Imagens enormes serão reduzidas para no máximo
    1920 px de largura ou altura.

    Imagens menores não serão aumentadas.
  */

  await imagem
    .resize({
      width:
        metadata.width && metadata.width > 1920
          ? 1920
          : undefined,

      height:
        metadata.height && metadata.height > 1920
          ? 1920
          : undefined,

      fit: "inside",
      withoutEnlargement: true
    })
    .webp({
      quality: 82,
      alphaQuality: 90,
      effort: 6,
      smartSubsample: true
    })
    .toFile(saida);

  const tamanhoNovo =
    (await fs.stat(saida)).size;

  const economia =
    Math.round(
      (1 - tamanhoNovo / tamanhoOriginal) * 100
    );

  console.log(
    `✓ ${nomeDoArquivo} → ${nomeWebp}`
  );

  console.log(
    `  ${formatarTamanho(tamanhoOriginal)} → ` +
    `${formatarTamanho(tamanhoNovo)} ` +
    `(${economia}% menor)`
  );

  return {
    antigo: nomeDoArquivo,
    novo: nomeWebp
  };
}

async function atualizarReferencias(conversoes) {
  for (const arquivo of arquivosDoCodigo) {
    let conteudo;

    try {
      conteudo =
        await fs.readFile(arquivo, "utf8");
    } catch {
      console.warn(
        `Não foi possível abrir: ${arquivo}`
      );

      continue;
    }

    let conteudoAtualizado =
      conteudo;

    for (const conversao of conversoes) {
      conteudoAtualizado =
        conteudoAtualizado.replaceAll(
          conversao.antigo,
          conversao.novo
        );
    }

    if (conteudoAtualizado !== conteudo) {
      await fs.writeFile(
        arquivo,
        conteudoAtualizado,
        "utf8"
      );

      console.log(
        `✓ Referências atualizadas em ${path.basename(arquivo)}`
      );
    }
  }
}

async function executar() {
  console.log(
    "\nConvertendo imagens para WebP...\n"
  );

  const arquivos =
    await fs.readdir(pastaDeImagens);

  const conversoes = [];

  for (const arquivo of arquivos) {
    const resultado =
      await converterImagem(arquivo);

    if (resultado) {
      conversoes.push(resultado);
    }
  }

  console.log(
    "\nAtualizando o código...\n"
  );

  await atualizarReferencias(
    conversoes
  );

  console.log(
    "\nTudo pronto."
  );

  console.log(
    "Os PNGs originais foram mantidos como segurança."
  );

  console.log(
    "O site agora utilizará os arquivos WebP.\n"
  );
}

executar().catch((error) => {
  console.error(
    "\nErro ao otimizar as imagens:\n",
    error
  );

  process.exitCode = 1;
});