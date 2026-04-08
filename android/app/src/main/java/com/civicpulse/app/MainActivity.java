package com.civicpulse.app;

import android.webkit.WebSettings;
import android.webkit.WebView;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {

  private static boolean sCacheClearedThisSession = false;

  @Override
  public void onResume() {
    super.onResume();
    if (getBridge() == null) return;
    WebView webView = getBridge().getWebView();
    if (webView == null) return;

    // Configure WebView for proper display scaling on Android
    WebSettings settings = webView.getSettings();
    settings.setUseWideViewPort(true);
    settings.setLoadWithOverviewMode(true);

    // Clear cache once per app launch
    if (!sCacheClearedThisSession) {
      webView.clearCache(true);
      sCacheClearedThisSession = true;
    }
  }
}
