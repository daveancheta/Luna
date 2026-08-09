import { PDFLoader } from "@langchain/community/document_loaders/fs/pdf";

export async function loadPDF() {
    const loader = new PDFLoader("./docs/who-lung-cancer.pdf");
    const docs = await loader.load();
    
    return docs
}

loadPDF()