var template = require('../emails/template');
var emailTemplate = template.emailTemplate;
var blocStats = template.blocStats;
var sectionResto = template.sectionResto;

var DESTINATAIRES = [
  'vincent.hilaire13@gmail.com',
  'Bkdirecteur500@gmail.com',
  'Bkdirecteur509@gmail.com',
  'Bkdirecteur526@gmail.com',
  'tech.bkmontpellier@gmail.com'
];

module.exports = function handler(req, res) {
  if (req.headers.authorization !== 'Bearer ' + process.env.CRON_SECRET) {
    return res.status(401).json({ error: 'Non autorise' });
  }

  try {
    var date = new Date().toLocaleDateString('fr-FR', {
      weekday: 'long', day: '2-digit', month: 'long', year: 'numeric'
    });

    // Donnees du jour — a connecter a Firebase en production
    var restos = {
      '500': { tickets_actifs: [], tickets_resolus_jour: [] },
      '509': { tickets_actifs: [], tickets_resolus_jour: [] },
      '526': { tickets_actifs: [], tickets_resolus_jour: [] }
    };

    var ids = Object.keys(restos);
    var totalActifs = ids.reduce(function(s, r) { return s + restos[r].tickets_actifs.length; }, 0);
    var totalCritiques = ids.reduce(function(s, r) {
      return s + restos[r].tickets_actifs.filter(function(t) { return t.status === 'critique'; }).length;
    }, 0);
    var totalResolus = ids.reduce(function(s, r) { return s + restos[r].tickets_resolus_jour.length; }, 0);
    var nonPris = ids.reduce(function(s, r) {
      return s + restos[r].tickets_actifs.filter(function(t) { return !t.prise_en_charge; }).length;
    }, 0);

    var contenu = '';

    // Alerte critique
    if (totalCritiques > 0) {
      contenu += '<div style="background:#FEE8EC;border-radius:8px;padding:12px 16px;margin-bottom:20px;border-left:4px solid #C8102E;">'
        + '<div style="font-size:13px;font-weight:800;color:#C8102E;">URGENT : ' + totalCritiques + ' panne critique en cours</div>'
        + '</div>';
    }

    // Alerte sans prise en charge
    if (nonPris > 0) {
      contenu += '<div style="background:#FFF3DC;border-radius:8px;padding:12px 16px;margin-bottom:20px;border-left:4px solid #B86B00;">'
        + '<div style="font-size:13px;font-weight:800;color:#B86B00;">' + nonPris + ' panne sans prise en charge</div>'
        + '</div>';
    }

    // Stats
    contenu += blocStats([
      { valeur: totalActifs, label: 'Pannes actives', couleur: totalActifs > 0 ? '#C8102E' : '#1A7D4D' },
      { valeur: totalCritiques, label: 'Critiques', couleur: '#C8102E' },
      { valeur: totalResolus, label: 'Resolues aujourd hui', couleur: '#1A7D4D' }
    ]);

    // Par restaurant
    contenu += '<div style="font-size:12px;font-weight:800;color:#9A9590;text-transform:uppercase;margin-bottom:12px;">ETAT PAR RESTAURANT</div>';
    ['500', '509', '526'].forEach(function(rid) {
      contenu += sectionResto(rid, restos[rid].tickets_actifs, restos[rid].tickets_resolus_jour);
    });

    var html = emailTemplate({
      titre: 'Rapport du soir - ' + date,
      sous_titre: 'Rapport 22h00',
      contenu: contenu,
      couleur: totalCritiques > 0 ? '#C8102E' : '#1A7D4D'
    });

    var Resend = require('resend').Resend;
    var resend = new Resend(process.env.RESEND_API_KEY);

    return resend.emails.send({
      from: 'BK Technique <onboarding@resend.dev>',
      to: DESTINATAIRES,
      subject: 'BK Technique - Rapport soir ' + date + (totalCritiques > 0 ? ' - CRITIQUE' : ''),
      html: html
    }).then(function() {
      return res.status(200).json({ success: true, envoye: DESTINATAIRES.length, pannes: totalActifs });
    });

  } catch (error) {
    console.error('[RAPPORT SOIR]', error);
    return res.status(500).json({ error: error.message });
  }
};
