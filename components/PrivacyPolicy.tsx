import React from 'react';

interface PrivacyPolicyProps {
  onClose: () => void;
}

export function PrivacyPolicy({ onClose }: PrivacyPolicyProps) {
  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50">
      <div className="fixed inset-x-4 top-8 bottom-8 md:inset-x-1/4 bg-card shadow-lg rounded-lg p-6 overflow-y-auto">
        <h2 className="text-2xl font-bold mb-4">Politique de Confidentialité</h2>
        <div className="space-y-4">
          <section>
            <h3 className="text-xl font-semibold mb-2">Introduction</h3>
            <p>Cette politique de confidentialité explique comment ChronoFlow collecte, utilise et protège vos informations personnelles.</p>
          </section>
          
          <section>
            <h3 className="text-xl font-semibold mb-2">Collecte des Données</h3>
            <p>Nous collectons les données suivantes :</p>
            <ul className="list-disc pl-6">
              <li>Données d'utilisation de l'application</li>
              <li>Préférences de l'utilisateur</li>
              <li>Données analytiques anonymes via Google Analytics</li>
            </ul>
          </section>

          <section>
            <h3 className="text-xl font-semibold mb-2">Publicité</h3>
            <p>Notre application utilise Google AdSense pour afficher des publicités. Google AdSense utilise des cookies pour diffuser des annonces pertinentes.</p>
          </section>

          <section>
            <h3 className="text-xl font-semibold mb-2">Utilisation des Données</h3>
            <p>Nous utilisons vos données pour :</p>
            <ul className="list-disc pl-6">
              <li>Améliorer l'expérience utilisateur</li>
              <li>Analyser l'utilisation de l'application</li>
              <li>Personnaliser le contenu</li>
            </ul>
          </section>

          <section>
            <h3 className="text-xl font-semibold mb-2">Protection des Données</h3>
            <p>Nous prenons la protection de vos données au sérieux et mettons en œuvre des mesures de sécurité appropriées.</p>
          </section>

          <section>
            <h3 className="text-xl font-semibold mb-2">Contact</h3>
            <p>Pour toute question concernant notre politique de confidentialité, contactez-nous.</p>
          </section>
        </div>
        
        <button 
          onClick={onClose}
          className="mt-6 px-4 py-2 bg-primary text-white rounded-md hover:bg-primary/90"
        >
          Fermer
        </button>
      </div>
    </div>
  );
}