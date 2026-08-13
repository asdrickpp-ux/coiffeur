document.addEventListener('DOMContentLoaded', () => {
  const btnCalculer = document.getElementById('btn-calculer');
  const resultBox = document.getElementById('calc-result');
  const resPrix = document.getElementById('res-prix');

  if (btnCalculer) {
    btnCalculer.addEventListener('click', () => {
      const dureeMinutes = parseFloat(document.getElementById('calc-duree').value) || 0;
      const tauxHoraire = parseFloat(document.getElementById('calc-taux').value) || 0;
      const produits = parseFloat(document.getElementById('calc-produits').value) || 0;
      const charges = parseFloat(document.getElementById('calc-charges').value) || 0;
      const margePct = parseFloat(document.getElementById('calc-marge').value) || 0;

      const coutMainOeuvre = (dureeMinutes / 60) * tauxHoraire;
      const coutTotal = coutMainOeuvre + produits + charges;
      const prixFinal = coutTotal * (1 + margePct / 100);

      resPrix.textContent = prixFinal.toFixed(2).replace('.', ',');
      resultBox.classList.remove('hidden');
    });
  }
});
