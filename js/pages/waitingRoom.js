Router.register('waiting-room', (app) => {
  app.innerHTML = `
    <div class="center">
      <h2>غرفة الانتظار</h2>
      <div class="loader"></div>
      <p style="color:#999;">بانتظار انضمام اللاعبين...</p>
      <button class="btn btn-secondary" id="back-btn">العودة للرئيسية</button>
    </div>
  `;

  document.getElementById('back-btn').addEventListener('click', () => {
    Router.navigate('home');
  });
});
