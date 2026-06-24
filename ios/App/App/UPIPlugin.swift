import Foundation
import Capacitor
import WebKit

@objc(UPIPlugin)
public class UPIPlugin: CAPPlugin {
    
    @objc public func shouldOverrideLoad(_ navigationAction: WKNavigationAction) -> NSNumber? {
        if let url = navigationAction.request.url, let scheme = url.scheme?.lowercased() {
            let upiSchemes = ["phonepe", "paytmmp", "gpay", "tez", "credpay", "bhim", "whatsapp", "upi"]
            
            if upiSchemes.contains(scheme) {
                DispatchQueue.main.async {
                    if UIApplication.shared.canOpenURL(url) {
                        UIApplication.shared.open(url, options: [:], completionHandler: nil)
                    } else {
                        CAPLog.print("UPI app not installed for scheme: \(scheme)")
                    }
                }
                return NSNumber(value: true) // Cancel WebView load, we handled it
            }
        }
        return nil // Let Capacitor handle it
    }
}
