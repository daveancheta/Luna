import { PDFLoader } from "@langchain/community/document_loaders/fs/pdf";

export async function loadPDF() {
    const loader = new PDFLoader("./docs/Lung Cancer Screening (PDQ®) - NCI.pdf");
    const docs = await loader.load();
    
    return docs
}

loadPDF()