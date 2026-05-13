// GLOBAL DEĞİŞKENLER aaaa
    let kullaniciAdi = "",   // Kullanıcının nickname'i
    secilenKategori = "",    // Aktif seçili kategori adı
    mevcutSoruIndex = 0,     // Kaçıncı soruda olduğumuzun takibi
    skor = 0,                // Doğru cevap sayısı
    aktifSoruHavuzu = [],    // Karıştırılmış ve seçilmiş 5 soru
    kullaniciCevaplari = []; // Analiz ekranı için verilen cevapların kaydı

let timerInterval;      // Zamanlayıcıyı kontrol etmek için
const SURE_SINIRI = 10; // Her soru için 10 saniye tanımla

// Fisher-Yates Karıştırma Algoritması: 
//Soruların ve şıkların her seferinde farklı sırada gelmesini sağlar.
function diziyiKaristir(dizi) {
    let yeniDizi = [...dizi];
    for (let i = yeniDizi.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [yeniDizi[i], yeniDizi[j]] = [yeniDizi[j], yeniDizi[i]];
    }
    return yeniDizi;
}

// Yanlış Şıkları Hazırlama:
//Doğru cevabın yanına ilgili kategoriden rastgele 3 tane yanlış cevap ekler.
function siklariHazirla(dogruSoru, tumHavuz) {

    //Doğru cevabı havuzdan çıkararak yanlışları belirle
    let yanlislar = tumHavuz.filter(s => s.cevap !== dogruSoru.cevap);

    //Yanlışları karıştır ve ilk 3 tanesini al
    let secilenYanlislar = diziyiKaristir(yanlislar).slice(0, 3);

    //Doğru cevap ile yanlışları birleştir
    let finalSiklar = [dogruSoru.cevap, ...secilenYanlislar.map(y => y.cevap)];

    //Şıkların yerini de rastgele karıştır (doğru cevap hep başta olmasın)
    return diziyiKaristir(finalSiklar);
}

// ZAMANLAYICI FONKSİYONU:
//Her soru için geri sayımı yönetir.
//Süre dolduğunda otomatik olarak soruyu 'Boş Bırak' işlemine sokar.
function zamanlayiciyiBaslat() {
    let kalanSure = SURE_SINIRI;
    $("#timer").text(`Süre: ${kalanSure}`);
    
    clearInterval(timerInterval);  //Yeni soruya geçince eski sayacı temizle

    timerInterval = setInterval(() => {
        kalanSure--;
        $("#timer").text(`Süre: ${kalanSure}`);

        if (kalanSure <= 0) {
            clearInterval(timerInterval);

            //Süre bittiğinde soruyu otomatik olarak "Boş" geç
            $("#skip-btn").click();
        }
    }, 1000);
}

// JQUERY DOCUMENT READY: Sayfa yüklendiğinde çalışacak olaylar
$(document).ready(function() {
    
    // NICKNAME GİRİŞİ: Kullanıcı adı kontrolü ve ekran geçişi
    $("#nickname-btn").click(function () {
        kullaniciAdi = $("#nickname-input").val().trim();
        if (kullaniciAdi === "") {
            alert("Lütfen bir nickname gir!");
            return;
        }

        //Mevcut ekranı yavaşça kapatıp ana ekranı açar (fadeOut/fadeIn)
        $("#nickname-screen").fadeOut(400, function() {
            $("#home-screen").removeClass("d-none").hide().fadeIn(400);
        });
    });

    // DARK MODE:Sayfanın rengini tersine çevirir
    $("#dark-mode-toggle").click(function () {
        $("body").toggleClass("dark-mode");
        $(this).text($("body").hasClass("dark-mode") ? "☀️" : "🌙");
    });

    // KATEGORİ SEÇİMİ: Buton aktiflik durumlarını yönetir
    $(".category-btn").click(function() {

        //Diğer butonların aktifliğini kaldır, tıklanana aktiflik ver
        $(".category-btn").removeClass("btn-primary text-white active animate__animated animate__pulse").addClass("btn-outline-primary");
        $(this).removeClass("btn-outline-primary").addClass("btn-primary text-white active animate__animated animate__pulse");
       
        secilenKategori = $(this).data("category");
        $("#start-game-btn").prop("disabled", false).removeClass("btn-dark").addClass("btn-success shadow");
    });

    // OYUNU BAŞLAT: Verileri hazırlar ve Quiz ekranına geçer
    $("#start-game-btn").click(function() {
        if (!secilenKategori) return;

        //Seçilen kategorideki verileri karıştır ve ilk 5 tanesini al
        aktifSoruHavuzu = diziyiKaristir([...veriler[secilenKategori]]).slice(0, 5);
        mevcutSoruIndex = 0;
        skor = 0;
        kullaniciCevaplari = [];

        $("#home-screen").fadeOut(400, function() {
            $("#quiz-screen").removeClass("d-none").hide().fadeIn(400);
            soruyuYukle();
        });
    });

    // SORU YÜKLEME: Ekrandaki resmi, metni ve şıkları günceller
    function soruyuYukle() {
        let soru = aktifSoruHavuzu[mevcutSoruIndex];
        $("#next-btn").prop("disabled", true);       //Cevap seçilmeden buton aktif olmaz
       
        //Buton stillerini sıfırla
        $(".option-btn").removeClass("selected btn-primary text-white").addClass("btn-outline-secondary");
        $("#question-count").text(`Soru: ${mevcutSoruIndex + 1} / 5`);
        $("#progress-bar").css("width", ((mevcutSoruIndex + 1) * 20) + "%");

        //Kategoriye göre soru metnini belirle
        if (soru.resim) {
            if (secilenKategori === "bayrak") $("#question-text").text("Bu bayrak hangi ülkeye ait?");
            else if (secilenKategori === "marka") $("#question-text").text("Bu logo hangi markaya ait?");
            else if (secilenKategori === "baskent") $("#question-text").text("Bu ülkenin başkenti neresidir?");
           
            $("#question-img").attr("src", soru.resim).removeClass("d-none");
        } else {
            $("#question-text").text(secilenKategori === "baskent" ? "Bu ülkenin başkenti neresidir?" : soru.soruMetni);
            $("#question-img").addClass("d-none");
        }

        //Şıkları oluştur ve butonlara dağıt
        let siklar = siklariHazirla(soru, veriler[secilenKategori]);
        $(".option-btn").each(function(i) { $(this).text(siklar[i]); });

        zamanlayiciyiBaslat();
    }

    // ŞIK SEÇİMİ: Kullanıcı bir seçeneğe tıkladığında görsel geri bildirim verir
    $(document).on("click", ".option-btn", function() {
        $(".option-btn").removeClass("selected btn-primary text-white").addClass("btn-outline-secondary");
        $(this).addClass("selected btn-primary text-white").removeClass("btn-outline-secondary");
        $("#next-btn").prop("disabled", false);
    });

    // SONRAKİ SORU: Cevabı kaydeder ve bir sonraki soruya geçer
    $("#next-btn").click(function() {
        clearInterval(timerInterval);
        let secilen = $(".option-btn.selected").text();
        let dogru = aktifSoruHavuzu[mevcutSoruIndex].cevap;

        //Analiz ekranı için cevabı kaydet
        kullaniciCevaplari.push({ soru: "Görsel Soru", verilen: secilen, dogru: dogru });
        if (secilen === dogru) skor++;
       
        mevcutSoruIndex++;
        // 5 soru bittiyse sonuç ekranına, bitmediyse yeni soruya git
        mevcutSoruIndex < 5 ? soruyuYukle() : sonuclariGoster();
    });

    // SORUYU BOŞ BIRAKMA: Kullanıcıyı soruyu boş bırakarak geçmek isterse
    $("#skip-btn").click(function() {
        clearInterval(timerInterval);
        let dogru = aktifSoruHavuzu[mevcutSoruIndex].cevap;
        kullaniciCevaplari.push({ soru: "Görsel Soru", verilen: "Boş", dogru: dogru });
        mevcutSoruIndex++;
        mevcutSoruIndex < 5 ? soruyuYukle() : sonuclariGoster();
    });

    // SONUÇLARI GÖSTER: Final skoru ve başarı madalyasını hesaplar
    function sonuclariGoster() {
        clearInterval(timerInterval);
        $("#quiz-screen").fadeOut(400, function() {
            $("#result-screen").removeClass("d-none").hide().fadeIn(400);
            $("#final-score").text(`${skor} / 5`);
            $("#player-name").text(`${kullaniciAdi} adlı oyuncunun skoru`);
        
            //Başarı durumuna göre madalya mesajı   
            let madalya = skor === 5 ? "🥇 Altın Madalya" : skor >= 4 ? "🥈 Gümüş Madalya" : skor >= 3 ? "🥉 Bronz Madalya" : "📘 Tekrar Dene";
            $("#medal-area").html(madalya);

            //Cevap analizi listesini oluştur
            let html = "";
            kullaniciCevaplari.forEach((c, i) => {
                let cls = c.verilen === c.dogru ? "list-group-item-success" : c.verilen === "Boş" ? "list-group-item-warning" : "list-group-item-danger";
                html += `<div class="list-group-item ${cls}"><b>${i+1}.</b> Verilen: ${c.verilen} | <b>Doğru: ${c.dogru}</b></div>`;
            });
            $("#answer-analysis").html(html);
        });
    }

    // TEKRAR OYNA: Aynı kategoriyle sıfırdan başlar
    $("#restart-btn").click(function() {
        $("#result-screen").fadeOut(400, function() {
            $("#quiz-screen").fadeIn(400);
            aktifSoruHavuzu = diziyiKaristir([...veriler[secilenKategori]]).slice(0, 5);
            mevcutSoruIndex = 0; skor = 0; kullaniciCevaplari = [];
            soruyuYukle();
        });
    });

   //Kategori Değiştir butonu (Sonuç ekranında)
$("#go-home-btn").click(function() { 
    $("#result-screen").fadeOut(400, function() {
        $("#home-screen").removeClass("d-none").hide().fadeIn(400);
        // Kategori seçimlerini sıfırla (görsel olarak)
        $(".category-btn").removeClass("btn-primary text-white active").addClass("btn-outline-primary");
        $("#start-game-btn").prop("disabled", true).removeClass("btn-success").addClass("btn-dark");
        secilenKategori = "";
    });
});

//Home ikonu (Oyun ekranında sol üstte)
$(document).on("click", "#home-icon-btn", function() { 
    var myModal = new bootstrap.Modal(document.getElementById('exitModal'));
    myModal.show();
});

//Modal içindeki "Evet, Başa Dön" butonu
$("#confirmExitBtn").click(function() {
    clearInterval(timerInterval); // Zamanlayıcıyı durdur
    var myModal = bootstrap.Modal.getInstance(document.getElementById('exitModal'));
    myModal.hide(); // Modalı kapat

    $("#quiz-screen").fadeOut(400, function() {
        $("#home-screen").removeClass("d-none").hide().fadeIn(400);
        // Kategori seçimlerini sıfırla
        $(".category-btn").removeClass("btn-primary text-white active").addClass("btn-outline-primary");
        $("#start-game-btn").prop("disabled", true).removeClass("btn-success").addClass("btn-dark");
        secilenKategori = "";
    });
});
});