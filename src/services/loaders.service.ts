import pdf from "pdf-parse";

export default class LoaderService {
  load(data: Buffer, type: "application/pdf" | "text/plain") {
    switch (type) {
      case "application/pdf":
        return this.load_pdf(data);
      case "text/plain":
        return this.load_txt(data);
      default:
        return this.load_txt(data);
    }
  }

  async load_pdf(data: Buffer) {
    const pdfData = await pdf(data);
    return pdfData.text;
  }

  load_txt(data: Buffer) {
    return data.toString();
  }
}
