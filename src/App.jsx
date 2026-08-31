import { useState, useRef } from 'react'

const GOOGLE_SCRIPT_URL =
  "https://script.google.com/macros/s/AKfycbx80FcQfZLANvy1UwlQjeVHq_qz14FOFLHo67jOecBMbNHPAHFNh_euMm5Gnz49YL__/exec";

function App() {
  const [files, setFiles] = useState([]);
  const [guestName, setGuestName] = useState("");
  const [message, setMessage] = useState("");
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [submitted, setSubmitted] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  // Estados da Galeria de Fotos
  const [showGallery, setShowGallery] = useState(false);
  const [photos, setPhotos] = useState([]);
  const [loadingGallery, setLoadingGallery] = useState(false);
  const [selectedPhoto, setSelectedPhoto] = useState(null);

  const fileInputRef = useRef(null);

  const handleFileSelect = (e) => {
    const selected = Array.from(e.target.files);
    const validFiles = selected.filter((file) =>
      file.type.startsWith("image/")
    );
    setFiles((prev) => [...prev, ...validFiles]);
  };

  const removeFile = (index) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const fileToBase64 = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        const base64String = reader.result.split(",")[1];
        resolve(base64String);
      };
      reader.onerror = (error) => reject(error);
    });
  };

  const handleUpload = async (e) => {
    e.preventDefault();

    if (!guestName.trim()) {
      setErrorMsg("Por favor, informe o seu nome para enviar as fotos.");
      return;
    }

    if (files.length === 0) {
      setErrorMsg("Por favor, selecione pelo menos uma foto.");
      return;
    }

    setUploading(true);
    setErrorMsg("");
    setProgress(0);

    let count = 0;

    try {
      for (const file of files) {
        const base64Data = await fileToBase64(file);

        const payload = {
          fileName: file.name,
          mimeType: file.type,
          base64Data: base64Data,
          guestName: guestName,
          message: message,
        };

        await fetch(GOOGLE_SCRIPT_URL, {
          method: "POST",
          mode: "no-cors",
          headers: {
            "Content-Type": "text/plain",
          },
          body: JSON.stringify(payload),
        });

        count++;
        setProgress(Math.round((count / files.length) * 100));
      }

      setSubmitted(true);
    } catch (err) {
      console.error(err);
      setErrorMsg("Ocorreu um erro ao enviar as fotos. Tente novamente.");
    } finally {
      setUploading(false);
    }
  };

  const resetForm = () => {
    setFiles([]);
    setGuestName("");
    setMessage("");
    setSubmitted(false);
    setProgress(0);
  };

  // Buscar fotos para a Galeria
  const openGallery = async () => {
    setShowGallery(true);
    setLoadingGallery(true);
    try {
      const res = await fetch(GOOGLE_SCRIPT_URL);
      const data = await res.json();
      if (data.photos) {
        setPhotos(data.photos);
      }
    } catch (err) {
      console.error("Erro ao carregar galeria:", err);
    } finally {
      setLoadingGallery(false);
    }
  };

  // Extrair o nome de quem enviou para exibir na moldura
  const getAuthorName = (photo) => {
    if (photo.description && photo.description.includes("Enviado por:")) {
      const match = photo.description.match(/Enviado por:\s*([^\n]+)/);
      if (match && match[1] && match[1] !== "Anônimo") {
        return match[1];
      }
    }
    return "Especial de Casamento";
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <header style={styles.header}>
          <span style={styles.subtitle}>CASAMENTO</span>
          <h1 style={styles.title}>Ana Beatriz & Carlos Eduardo</h1>
          <div style={styles.divider}>✦</div>
          <p style={styles.description}>
            {showGallery
              ? "Álbum de fotos e memórias compartilhadas por nossos convidados!"
              : "Compartilhe conosco os momentos e olhares que você registrou durante nossa celebração!"}
          </p>
        </header>

        {showGallery ? (
          /* ================= TELA DO ÁLBUM DE FOTOS ================= */
          <div style={styles.gallerySection}>
            <div style={styles.galleryHeaderActions}>
              <button
                type="button"
                onClick={() => setShowGallery(false)}
                style={styles.btnSecondary}
              >
                ← ENVIAR NOVAS FOTOS
              </button>
            </div>

            {loadingGallery ? (
              <div style={styles.loadingState}>
                <div style={styles.spinner}>📷</div>
                <p>Abrindo o álbum de memórias...</p>
              </div>
            ) : photos.length === 0 ? (
              <div style={styles.emptyState}>
                <p>Ainda não há fotos no álbum. Seja o primeiro a enviar!</p>
              </div>
            ) : (
              <div style={styles.albumGrid}>
                {photos.map((photo) => (
                  <div
                    key={photo.id}
                    style={styles.polaroidCard}
                    onClick={() => setSelectedPhoto(photo)}
                  >
                    <div style={styles.polaroidImageWrapper}>
                      <img
                        src={photo.url}
                        alt="Foto do casamento"
                        style={styles.polaroidImg}
                        loading="lazy"
                      />
                    </div>
                    <span style={styles.polaroidLabel}>
                      🤍 {getAuthorName(photo)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : submitted ? (
          /* ================= TELA DE SUCESSO ================= */
          <div style={styles.successState}>
            <div style={styles.heartIcon}>🤍</div>
            <h2 style={styles.successTitle}>Fotos Enviadas com Sucesso!</h2>
            <p style={styles.successText}>
              Muito obrigado por fazer parte do nosso dia inesquecível e por
              compartilhar essas memórias conosco.
            </p>
            <div style={styles.buttonGroup}>
              <button onClick={openGallery} style={styles.btnPrimary}>
                🖼️ VER ÁLBUM DE FOTOS
              </button>
              <button onClick={resetForm} style={styles.btnSecondary}>
                ENVIAR MAIS FOTOS
              </button>
            </div>
          </div>
        ) : (
          /* ================= FORMULÁRIO DE UPLOAD ================= */
          <form onSubmit={handleUpload} style={styles.form}>
            <div style={styles.inputGroup}>
              <label style={styles.label}>
                Seu Nome <span style={styles.requiredStar}>*</span>
              </label>
              <input
                type="text"
                placeholder="Ex: Maria & João"
                value={guestName}
                onChange={(e) => setGuestName(e.target.value)}
                style={styles.input}
                required
              />
            </div>

            <div style={styles.inputGroup}>
              <label style={styles.label}>
                Deixe um recado especial (opcional)
              </label>
              <textarea
                placeholder="Escreva seu carinho aos noivos..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={3}
                style={{ ...styles.input, resize: "vertical" }}
              />
            </div>

            <div
              style={styles.dropzone}
              onClick={() => fileInputRef.current?.click()}
            >
              <input
                type="file"
                ref={fileInputRef}
                multiple
                accept="image/*"
                onChange={handleFileSelect}
                style={{ display: "none" }}
              />
              <div style={styles.uploadIcon}>📷</div>
              <p style={styles.dropzoneText}>Toque aqui para selecionar fotos</p>
              <span style={styles.dropzoneSub}>
                Você pode enviar várias de uma vez
              </span>
            </div>

            {files.length > 0 && (
              <div style={styles.previewSection}>
                <p style={styles.previewCount}>
                  {files.length} foto(s) selecionada(s)
                </p>
                <div style={styles.previewGrid}>
                  {files.map((file, idx) => (
                    <div key={idx} style={styles.thumbWrapper}>
                      <img
                        src={URL.createObjectURL(file)}
                        alt={`Preview ${idx}`}
                        style={styles.thumbImg}
                      />
                      <button
                        type="button"
                        onClick={() => removeFile(idx)}
                        style={styles.removeBtn}
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {errorMsg && <p style={styles.errorText}>{errorMsg}</p>}

            {uploading && (
              <div style={styles.progressContainer}>
                <div style={styles.progressBar}>
                  <div
                    style={{ ...styles.progressFill, width: `${progress}%` }}
                  />
                </div>
                <span style={styles.progressText}>Enviando... {progress}%</span>
              </div>
            )}

            <button
              type="submit"
              disabled={uploading || files.length === 0 || !guestName.trim()}
              style={{
                ...styles.btnPrimary,
                opacity:
                  uploading || files.length === 0 || !guestName.trim()
                    ? 0.6
                    : 1,
                cursor:
                  uploading || files.length === 0 || !guestName.trim()
                    ? "not-allowed"
                    : "pointer",
              }}
            >
              {uploading ? "ENVIANDO FOTOS..." : "PUBLICAR FOTOS NO ÁLBUM"}
            </button>

            <button
              type="button"
              onClick={openGallery}
              style={styles.btnSecondary}
            >
              🖼️ VER ÁLBUM DE FOTOS
            </button>
          </form>
        )}
      </div>

      {/* MODAL DE AMPLIAÇÃO / ZOOM */}
      {selectedPhoto && (
        <div style={styles.lightboxOverlay} onClick={() => setSelectedPhoto(null)}>
          <button
            style={styles.lightboxCloseBtn}
            onClick={() => setSelectedPhoto(null)}
          >
            ✕
          </button>
          <div style={styles.lightboxContent} onClick={(e) => e.stopPropagation()}>
            <img
              src={selectedPhoto.url}
              alt="Foto Ampliada"
              style={styles.lightboxImg}
            />
            {selectedPhoto.description && (
              <div style={styles.photoCaption}>
                {selectedPhoto.description.split("\n").map((line, i) => (
                  <p key={i} style={{ margin: "4px 0" }}>{line}</p>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

const styles = {
  container: {
    minHeight: "100vh",
    width: "100vw",
    background:
      "radial-gradient(circle at center, #faf7ef 0%, #f1ede2 55%, #e8e2d4 100%)",
    fontFamily: 'Georgia, "Times New Roman", serif',
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "20px 12px",
    boxSizing: "border-box",
  },
  card: {
    background: "#ffffff",
    width: "100%",
    maxWidth: "580px",
    borderRadius: "12px",
    padding: "32px 24px",
    boxShadow: "0 12px 30px rgba(38, 43, 29, 0.15)",
    border: "1px solid rgba(46, 58, 32, 0.1)",
  },
  header: {
    textAlign: "center",
    marginBottom: "24px",
  },
  subtitle: {
    fontSize: "11px",
    letterSpacing: "3px",
    color: "#3d472f",
    textTransform: "uppercase",
    opacity: 0.85,
  },
  title: {
    fontSize: "24px",
    color: "#2e3a20",
    margin: "8px 0",
    fontWeight: "normal",
  },
  divider: {
    color: "#4a5638",
    fontSize: "14px",
    margin: "6px 0",
  },
  description: {
    fontSize: "14px",
    color: "#414d32",
    lineHeight: "1.5",
    marginTop: "8px",
  },
  form: {
    display: "flex",
    flexDirection: "column",
    gap: "18px",
  },
  inputGroup: {
    display: "flex",
    flexDirection: "column",
    gap: "6px",
  },
  label: {
    fontSize: "12px",
    color: "#2e3a20",
    letterSpacing: "0.5px",
    textTransform: "uppercase",
  },
  requiredStar: {
    color: "#a94442",
    fontWeight: "bold",
  },
  input: {
    padding: "10px 14px",
    borderRadius: "6px",
    border: "1px solid #dcd5c7",
    background: "#faf7ef",
    fontFamily: "Georgia, serif",
    fontSize: "14px",
    color: "#333",
    outline: "none",
  },
  dropzone: {
    border: "2px dashed #4a5638",
    borderRadius: "8px",
    padding: "24px",
    textAlign: "center",
    background: "rgba(241, 237, 226, 0.4)",
    cursor: "pointer",
  },
  uploadIcon: {
    fontSize: "32px",
    marginBottom: "8px",
  },
  dropzoneText: {
    color: "#2e3a20",
    fontSize: "14px",
    fontWeight: "bold",
    margin: "4px 0",
  },
  dropzoneSub: {
    fontSize: "12px",
    color: "#414d32",
    opacity: 0.8,
  },
  previewSection: {
    marginTop: "8px",
  },
  previewCount: {
    fontSize: "12px",
    color: "#3d472f",
    marginBottom: "8px",
  },
  previewGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(4, 1fr)",
    gap: "8px",
  },
  thumbWrapper: {
    position: "relative",
    aspectRatio: "1",
    borderRadius: "6px",
    overflow: "hidden",
    border: "1px solid #dcd5c7",
  },
  thumbImg: {
    width: "100%",
    height: "100%",
    objectFit: "cover",
  },
  removeBtn: {
    position: "absolute",
    top: "2px",
    right: "2px",
    background: "rgba(0,0,0,0.6)",
    color: "#fff",
    border: "none",
    borderRadius: "50%",
    width: "20px",
    height: "20px",
    fontSize: "10px",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  btnPrimary: {
    backgroundColor: "#2e3a20",
    color: "#ffffff",
    padding: "14px 20px",
    borderRadius: "30px",
    border: "1px solid rgba(255, 255, 255, 0.15)",
    fontFamily: "Georgia, serif",
    fontSize: "12px",
    letterSpacing: "1.5px",
    textTransform: "uppercase",
    boxShadow: "0 4px 12px rgba(0, 0, 0, 0.2)",
    transition: "all 0.3s ease",
    marginTop: "8px",
    textAlign: "center",
    width: "100%",
    cursor: "pointer",
  },
  btnSecondary: {
    backgroundColor: "transparent",
    color: "#2e3a20",
    padding: "12px 20px",
    borderRadius: "30px",
    border: "1px solid #2e3a20",
    fontFamily: "Georgia, serif",
    fontSize: "12px",
    letterSpacing: "1.5px",
    textTransform: "uppercase",
    textAlign: "center",
    display: "block",
    width: "100%",
    cursor: "pointer",
    transition: "all 0.3s ease",
  },
  buttonGroup: {
    display: "flex",
    flexDirection: "column",
    gap: "12px",
    marginTop: "16px",
  },
  progressContainer: {
    display: "flex",
    flexDirection: "column",
    gap: "6px",
    alignItems: "center",
  },
  progressBar: {
    width: "100%",
    height: "8px",
    backgroundColor: "#e8e2d4",
    borderRadius: "4px",
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    backgroundColor: "#2e3a20",
    transition: "width 0.3s ease",
  },
  progressText: {
    fontSize: "12px",
    color: "#3d472f",
  },
  errorText: {
    color: "#a94442",
    fontSize: "13px",
    textAlign: "center",
  },
  successState: {
    textAlign: "center",
    padding: "20px 10px",
  },
  heartIcon: {
    fontSize: "40px",
    marginBottom: "12px",
  },
  successTitle: {
    color: "#2e3a20",
    fontSize: "20px",
    marginBottom: "10px",
    fontWeight: "normal",
  },
  successText: {
    color: "#414d32",
    fontSize: "14px",
    lineHeight: "1.6",
    marginBottom: "20px",
  },

  /* GALERIA DE FOTOS */
  gallerySection: {
    display: "flex",
    flexDirection: "column",
    gap: "16px",
  },
  galleryHeaderActions: {
    marginBottom: "8px",
  },
  loadingState: {
    textAlign: "center",
    padding: "40px 0",
    color: "#2e3a20",
  },
  spinner: {
    fontSize: "36px",
    marginBottom: "12px",
  },
  emptyState: {
    textAlign: "center",
    padding: "40px 20px",
    color: "#414d32",
    fontSize: "14px",
  },
  albumGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(150px, 1fr))",
    gap: "18px",
    maxHeight: "520px",
    overflowY: "auto",
    padding: "10px 6px 20px 6px",
  },
  polaroidCard: {
    background: "#ffffff",
    padding: "8px 8px 12px 8px",
    borderRadius: "4px",
    boxShadow: "0 6px 16px rgba(0, 0, 0, 0.08)",
    border: "1px solid #e8e2d4",
    cursor: "pointer",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    transition: "transform 0.25s ease, box-shadow 0.25s ease",
  },
  polaroidImageWrapper: {
    width: "100%",
    aspectRatio: "4/3",
    overflow: "hidden",
    borderRadius: "2px",
    backgroundColor: "#f7f5ed",
  },
  polaroidImg: {
    width: "100%",
    height: "100%",
    objectFit: "cover",
  },
  polaroidLabel: {
    marginTop: "8px",
    fontSize: "11px",
    color: "#3d472f",
    fontFamily: 'Georgia, serif',
    fontStyle: "italic",
    textAlign: "center",
    width: "100%",
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
  },

  /* LIGHTBOX MODAL */
  lightboxOverlay: {
    position: "fixed",
    top: 0,
    left: 0,
    width: "100vw",
    height: "100vh",
    backgroundColor: "rgba(0, 0, 0, 0.88)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 1000,
    padding: "20px",
    boxSizing: "border-box",
  },
  lightboxContent: {
    position: "relative",
    maxWidth: "90%",
    maxHeight: "90vh",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
  },
  lightboxImg: {
    maxWidth: "100%",
    maxHeight: "75vh",
    borderRadius: "8px",
    objectFit: "contain",
  },
  lightboxCloseBtn: {
    position: "fixed",
    top: "20px",
    right: "20px",
    width: "40px",
    height: "40px",
    borderRadius: "50%",
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    color: "#ffffff",
    border: "1px solid rgba(255, 255, 255, 0.3)",
    fontSize: "18px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
    zIndex: 1010,
    boxShadow: "0 4px 10px rgba(0, 0, 0, 0.3)",
  },
  photoCaption: {
    marginTop: "12px",
    color: "#ffffff",
    textAlign: "center",
    fontSize: "14px",
    background: "rgba(0, 0, 0, 0.6)",
    padding: "8px 16px",
    borderRadius: "20px",
  },
};

export default App;