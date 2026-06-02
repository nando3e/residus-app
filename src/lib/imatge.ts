// Comprimeix/redimensiona una imatge al navegador abans de pujar-la.
// Redueix fotos de mòbil de diversos MB a ~100-300 KB.
export async function comprimirImatge(
  file: File,
  maxLado = 1280,
  qualitat = 0.7
): Promise<Blob> {
  if (!file.type.startsWith("image/")) return file;

  try {
    const dataUrl = await new Promise<string>((res, rej) => {
      const fr = new FileReader();
      fr.onload = () => res(fr.result as string);
      fr.onerror = rej;
      fr.readAsDataURL(file);
    });

    const img = await new Promise<HTMLImageElement>((res, rej) => {
      const i = new Image();
      i.onload = () => res(i);
      i.onerror = rej;
      i.src = dataUrl;
    });

    let { width, height } = img;
    if (width > maxLado || height > maxLado) {
      if (width >= height) {
        height = Math.round((height * maxLado) / width);
        width = maxLado;
      } else {
        width = Math.round((width * maxLado) / height);
        height = maxLado;
      }
    }

    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    if (!ctx) return file;
    ctx.drawImage(img, 0, 0, width, height);

    const blob = await new Promise<Blob | null>((res) =>
      canvas.toBlob(res, "image/jpeg", qualitat)
    );
    return blob || file;
  } catch {
    return file; // si falla, puja l'original
  }
}
