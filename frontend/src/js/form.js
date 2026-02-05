export function initForm() {
    const form = document.getElementById('formDaftar');
    if (!form) return;

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const formData = new FormData(form);
        
        try {
            const response = await fetch('/api/daftar', {
                method: 'POST',
                body: formData
            });
            const result = await response.json();
            if (result.success) {
                alert('Pendaftaran Berhasil!');
                window.navigate('dashboard'); // Pindah otomatis ke dashboard setelah daftar
            }
        } catch (error) {
            alert('Gagal mengirim data');
        }
    });
}