/* Geração e compartilhamento de listas em PDF para as telas da BLK. */
(function () {
    function obterJsPdf() {
        if (!window.jspdf || !window.jspdf.jsPDF) {
            throw new Error("A biblioteca de PDF ainda não foi carregada.");
        }
        return window.jspdf.jsPDF;
    }

    function textoSeguro(valor) {
        return String(valor ?? "").replace(/\s+/g, " ").trim() || "-";
    }

    function nomeSeguro(nomeArquivo) {
        return String(nomeArquivo || "lista.pdf")
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "")
            .replace(/[^a-z0-9._-]+/gi, "_")
            .replace(/^_+|_+$/g, "") || "lista.pdf";
    }

    function criarDocumentoLista({ titulo, subtitulo, colunas, linhas }) {
        const jsPDF = obterJsPdf();
        const pdf = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
        const largura = pdf.internal.pageSize.getWidth();
        const altura = pdf.internal.pageSize.getHeight();
        const margem = 14;
        const larguraUtil = largura - (margem * 2);
        const larguras = colunas.map(coluna => coluna.largura || larguraUtil / colunas.length);

        function cabecalho() {
            pdf.setFillColor(0, 63, 151);
            pdf.rect(0, 0, largura, 18, "F");
            pdf.setTextColor(255, 255, 255);
            pdf.setFont("helvetica", "bold");
            pdf.setFontSize(17);
            pdf.text("BLK", margem, 11.5);
            pdf.setTextColor(0, 63, 151);
            pdf.setFontSize(16);
            pdf.text(textoSeguro(titulo), margem, 30);
            pdf.setFont("helvetica", "normal");
            pdf.setFontSize(9);
            pdf.setTextColor(85, 85, 85);
            pdf.text(textoSeguro(subtitulo), margem, 36);
        }

        function rodape(numeroPagina) {
            pdf.setDrawColor(220, 220, 220);
            pdf.line(margem, altura - 11, largura - margem, altura - 11);
            pdf.setFontSize(8);
            pdf.setTextColor(105, 105, 105);
            pdf.text(`Gerado em ${new Date().toLocaleString("pt-BR")}`, margem, altura - 6);
            pdf.text(`Página ${numeroPagina}`, largura - margem, altura - 6, { align: "right" });
        }

        function desenharCabecalhoTabela(y) {
            let x = margem;
            pdf.setFillColor(11, 77, 173);
            pdf.rect(margem, y, larguraUtil, 8, "F");
            pdf.setFont("helvetica", "bold");
            pdf.setFontSize(8.5);
            pdf.setTextColor(255, 255, 255);
            colunas.forEach((coluna, indice) => {
                pdf.text(textoSeguro(coluna.titulo), x + 2, y + 5.2);
                x += larguras[indice];
            });
            return y + 8;
        }

        let pagina = 1;
        cabecalho();
        let y = desenharCabecalhoTabela(42);
        const registros = Array.isArray(linhas) ? linhas : [];

        if (!registros.length) {
            pdf.setFont("helvetica", "normal");
            pdf.setFontSize(10);
            pdf.setTextColor(90, 90, 90);
            pdf.text("Nenhum registro encontrado.", margem + 2, y + 8);
        }

        registros.forEach((linha, indice) => {
            const celulas = colunas.map((coluna, colunaIndice) =>
                pdf.splitTextToSize(textoSeguro(linha[coluna.chave]), larguras[colunaIndice] - 4)
            );
            const alturaLinha = Math.max(8, ...celulas.map(texto => texto.length * 4.2 + 3));

            if (y + alturaLinha > altura - 15) {
                rodape(pagina);
                pdf.addPage();
                pagina += 1;
                cabecalho();
                y = desenharCabecalhoTabela(42);
            }

            let x = margem;
            pdf.setDrawColor(217, 217, 217);
            pdf.setFillColor(indice % 2 === 0 ? 255 : 247, indice % 2 === 0 ? 255 : 249, indice % 2 === 0 ? 255 : 252);
            pdf.rect(margem, y, larguraUtil, alturaLinha, "FD");
            pdf.setFont("helvetica", "normal");
            pdf.setFontSize(8.5);
            pdf.setTextColor(45, 45, 45);
            celulas.forEach((texto, colunaIndice) => {
                pdf.text(texto, x + 2, y + 5, { baseline: "top" });
                if (colunaIndice > 0) pdf.line(x, y, x, y + alturaLinha);
                x += larguras[colunaIndice];
            });
            y += alturaLinha;
        });

        rodape(pagina);
        return pdf;
    }

    function baixar(opcoes) {
        const pdf = criarDocumentoLista(opcoes);
        pdf.save(nomeSeguro(opcoes.nomeArquivo));
    }

    async function compartilhar(opcoes) {
        const pdf = criarDocumentoLista(opcoes);
        const arquivo = new File([pdf.output("blob")], nomeSeguro(opcoes.nomeArquivo), { type: "application/pdf" });
        if (navigator.canShare && navigator.canShare({ files: [arquivo] })) {
            try {
                await navigator.share({ title: opcoes.titulo, files: [arquivo] });
                return;
            } catch (erro) {
                if (erro && erro.name === "AbortError") return;
                console.warn("Não foi possível compartilhar o PDF.", erro);
            }
        }
        pdf.save(nomeSeguro(opcoes.nomeArquivo));
        alert("Seu navegador não permite compartilhar arquivos diretamente. O PDF foi baixado para compartilhamento manual.");
    }

    window.BLKPDF = { baixar, compartilhar };
}());
