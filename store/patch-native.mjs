// Ergänzt Berechtigungstexte und Einstellungen in den nativen Projekten (mehrfach ausführbar)
import fs from "node:fs";
import path from "node:path";
const here = path.dirname(new URL(import.meta.url).pathname);

// ---------- iOS ----------
const plist = path.join(here, "ios/App/App/Info.plist");
if (fs.existsSync(plist)) {
  let p = fs.readFileSync(plist, "utf8");
  const set = (key, xml) => {
    const re = new RegExp(`\\s*<key>${key}</key>\\s*(<string>[^<]*</string>|<true/>|<false/>|<array>[\\s\\S]*?</array>)`);
    p = re.test(p) ? p.replace(re, `\n\t<key>${key}</key>\n\t${xml}`) : p.replace(/<\/dict>\s*<\/plist>\s*$/, `\t<key>${key}</key>\n\t${xml}\n</dict>\n</plist>\n`);
  };
  set("CFBundleDisplayName", "<string>Formwerk</string>");
  set("NSCameraUsageDescription", "<string>Formwerk braucht die Kamera für den Barcode-Scanner und für Fotos deiner Mahlzeiten.</string>");
  set("NSPhotoLibraryUsageDescription", "<string>Damit du ein Foto deiner Mahlzeit für die Kalorien-Schätzung auswählen kannst.</string>");
  set("NSLocationWhenInUseUsageDescription", "<string>Formwerk misst während deines Laufs die Distanz per GPS. Gespeichert wird nur die Distanz, keine Strecke.</string>");
  set("ITSAppUsesNonExemptEncryption", "<false/>");
  set("UIRequiresFullScreen", "<true/>");
  set("UISupportedInterfaceOrientations", "<array>\n\t\t<string>UIInterfaceOrientationPortrait</string>\n\t</array>");
  fs.writeFileSync(plist, p);
  // Nur iPhone (sonst verlangt Apple zusätzlich iPad-Screenshots)
  const pbx = path.join(here, "ios/App/App.xcodeproj/project.pbxproj");
  if (fs.existsSync(pbx)) fs.writeFileSync(pbx, fs.readFileSync(pbx, "utf8").replace(/TARGETED_DEVICE_FAMILY = "1,2";/g, "TARGETED_DEVICE_FAMILY = 1;"));
  console.log("iOS: Berechtigungstexte und Einstellungen gesetzt.");
}

// ---------- Android ----------
const man = path.join(here, "android/app/src/main/AndroidManifest.xml");
if (fs.existsSync(man)) {
  let m = fs.readFileSync(man, "utf8");
  const perms = ["android.permission.CAMERA", "android.permission.ACCESS_FINE_LOCATION", "android.permission.ACCESS_COARSE_LOCATION", "android.permission.POST_NOTIFICATIONS"];
  for (const pr of perms) if (!m.includes(`"${pr}"`)) m = m.replace(/(\s*)<application/, `$1<uses-permission android:name="${pr}" />$1<application`);
  if (!m.includes("android.hardware.camera")) m = m.replace(/(\s*)<application/, `$1<uses-feature android:name="android.hardware.camera" android:required="false" />$1<application`);
  if (!m.includes("screenOrientation")) m = m.replace(/<activity\b/, '<activity android:screenOrientation="portrait"');
  fs.writeFileSync(man, m);
  console.log("Android: Berechtigungen und Hochformat gesetzt.");
}
