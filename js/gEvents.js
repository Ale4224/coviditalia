let sendEvent = function(event, category, label) {
    gtag('event', event, {
        'event_category': category,
        'event_label': label
    });
}