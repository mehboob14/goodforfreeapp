import WidgetKit
import SwiftUI
import UIKit

// MARK: - Shared

private let accent = Color(red: 0x7C / 255.0, green: 0x5C / 255.0, blue: 0xFF / 255.0)

extension String {
  /// Lightweight HTML strip for WordPress titles (safe off the main thread).
  var strippedHTML: String {
    let noTags = self.replacingOccurrences(
      of: "<[^>]+>", with: "", options: .regularExpression
    )
    return noTags
      .replacingOccurrences(of: "&#8217;", with: "\u{2019}")
      .replacingOccurrences(of: "&#8216;", with: "\u{2018}")
      .replacingOccurrences(of: "&#8220;", with: "\u{201C}")
      .replacingOccurrences(of: "&#8221;", with: "\u{201D}")
      .replacingOccurrences(of: "&#038;", with: "&")
      .replacingOccurrences(of: "&amp;", with: "&")
      .replacingOccurrences(of: "&hellip;", with: "\u{2026}")
      .replacingOccurrences(of: "&nbsp;", with: " ")
      .trimmingCharacters(in: .whitespacesAndNewlines)
  }
}

// MARK: - Clock widget

struct ClockEntry: TimelineEntry {
  let date: Date
}

struct ClockProvider: TimelineProvider {
  func placeholder(in context: Context) -> ClockEntry { ClockEntry(date: Date()) }

  func getSnapshot(in context: Context, completion: @escaping (ClockEntry) -> Void) {
    completion(ClockEntry(date: Date()))
  }

  func getTimeline(in context: Context, completion: @escaping (Timeline<ClockEntry>) -> Void) {
    // One entry now; SwiftUI's Text(date, style:) ticks the minutes live.
    // Refresh hourly so the date stays correct.
    let entry = ClockEntry(date: Date())
    let next = Calendar.current.date(byAdding: .hour, value: 1, to: Date()) ?? Date().addingTimeInterval(3600)
    completion(Timeline(entries: [entry], policy: .after(next)))
  }
}

struct ClockWidgetView: View {
  var entry: ClockEntry
  @Environment(\.widgetFamily) var family

  var body: some View {
    Group {
      switch family {
      case .accessoryInline:
        Text(entry.date, style: .time)
      case .accessoryRectangular:
        VStack(alignment: .leading, spacing: 2) {
          Text(entry.date, style: .time)
            .font(.system(size: 22, weight: .semibold, design: .rounded))
          Text(entry.date, style: .date)
            .font(.system(size: 12))
            .foregroundStyle(.secondary)
        }
      default:
        VStack(spacing: 4) {
          Text(entry.date, style: .time)
            .font(.system(size: 38, weight: .light, design: .rounded))
            .foregroundStyle(.primary)
          Text(entry.date, style: .date)
            .font(.system(size: 13))
            .foregroundStyle(.secondary)
          RoundedRectangle(cornerRadius: 2)
            .fill(accent)
            .frame(width: 40, height: 3)
            .padding(.top, 4)
        }
      }
    }
    .frame(maxWidth: .infinity, maxHeight: .infinity)
    .containerBackground(for: .widget) {
      if family == .systemSmall || family == .systemMedium {
        Color(.systemBackground)
      } else {
        Color.clear
      }
    }
    .widgetURL(URL(string: "goodforfree://"))
  }
}

struct ClockWidget: Widget {
  let kind = "GoodForFreeClock"
  var body: some WidgetConfiguration {
    StaticConfiguration(kind: kind, provider: ClockProvider()) { entry in
      ClockWidgetView(entry: entry)
    }
    .configurationDisplayName("GoodForFree Clock")
    .description("A clean clock for your home or lock screen.")
    .supportedFamilies([
      .systemSmall,
      .systemMedium,
      .accessoryRectangular,
      .accessoryInline,
    ])
  }
}

// MARK: - Article widget

struct ArticleEntry: TimelineEntry {
  let date: Date
  let title: String
  let category: String
  let imageData: Data?
  let articleId: Int?
}

struct ArticleProvider: TimelineProvider {
  func placeholder(in context: Context) -> ArticleEntry {
    ArticleEntry(date: Date(), title: "Latest from GoodForFree", category: "FEATURED", imageData: nil, articleId: nil)
  }

  func getSnapshot(in context: Context, completion: @escaping (ArticleEntry) -> Void) {
    fetchLatest(completion: completion)
  }

  func getTimeline(in context: Context, completion: @escaping (Timeline<ArticleEntry>) -> Void) {
    fetchLatest { entry in
      let next = Calendar.current.date(byAdding: .minute, value: 30, to: Date()) ?? Date().addingTimeInterval(1800)
      completion(Timeline(entries: [entry], policy: .after(next)))
    }
  }

  private func fetchLatest(completion: @escaping (ArticleEntry) -> Void) {
    let fallback = ArticleEntry(date: Date(), title: "GoodForFree", category: "FEATURED", imageData: nil, articleId: nil)
    guard let url = URL(string: "https://goodforfree.com/wp-json/wp/v2/posts?per_page=1&_embed=1") else {
      completion(fallback)
      return
    }
    URLSession.shared.dataTask(with: url) { data, _, _ in
      guard
        let data = data,
        let arr = try? JSONSerialization.jsonObject(with: data) as? [[String: Any]],
        let post = arr.first
      else {
        completion(fallback)
        return
      }

      let id = post["id"] as? Int
      let titleHTML = ((post["title"] as? [String: Any])?["rendered"] as? String) ?? "GoodForFree"
      let title = titleHTML.strippedHTML

      var category = "FEATURED"
      var imageURLString: String?
      if let embedded = post["_embedded"] as? [String: Any] {
        if let terms = embedded["wp:term"] as? [[[String: Any]]] {
          outer: for group in terms {
            for term in group where (term["taxonomy"] as? String) == "category" {
              if let name = term["name"] as? String { category = name.uppercased(); break outer }
            }
          }
        }
        if let media = embedded["wp:featuredmedia"] as? [[String: Any]], let first = media.first {
          if let details = first["media_details"] as? [String: Any],
             let sizes = details["sizes"] as? [String: Any] {
            let pick = (sizes["medium_large"] as? [String: Any]) ?? (sizes["medium"] as? [String: Any]) ?? (sizes["large"] as? [String: Any])
            imageURLString = (pick?["source_url"] as? String) ?? (first["source_url"] as? String)
          } else {
            imageURLString = first["source_url"] as? String
          }
        }
      }

      let entry = ArticleEntry(date: Date(), title: title, category: category, imageData: nil, articleId: id)

      if let imageURLString = imageURLString, let imgURL = URL(string: imageURLString) {
        URLSession.shared.dataTask(with: imgURL) { idata, _, _ in
          let withImage = ArticleEntry(date: Date(), title: title, category: category, imageData: idata, articleId: id)
          completion(withImage)
        }.resume()
      } else {
        completion(entry)
      }
    }.resume()
  }
}

struct ArticleWidgetView: View {
  var entry: ArticleEntry
  @Environment(\.widgetFamily) var family

  private var uiImage: UIImage? {
    if let data = entry.imageData { return UIImage(data: data) }
    return nil
  }

  var body: some View {
    let deepLink = URL(string: "goodforfree://article/\(entry.articleId.map(String.init) ?? "")")
    Group {
      switch family {
      case .systemMedium:
        HStack(spacing: 12) {
          thumbnail(size: 84)
          textBlock
          Spacer(minLength: 0)
        }
      case .systemLarge:
        VStack(alignment: .leading, spacing: 10) {
          banner(height: 180)
          textBlock
          Spacer(minLength: 0)
        }
      default: // systemSmall
        ZStack(alignment: .bottomLeading) {
          if let img = uiImage {
            Image(uiImage: img).resizable().scaledToFill()
            LinearGradient(
              colors: [.black.opacity(0.0), .black.opacity(0.75)],
              startPoint: .center, endPoint: .bottom
            )
          }
          VStack(alignment: .leading, spacing: 3) {
            Text(entry.category).font(.system(size: 10, weight: .bold)).foregroundStyle(accent)
            Text(entry.title)
              .font(.system(size: 13, weight: .semibold))
              .foregroundStyle(uiImage == nil ? Color.primary : Color.white)
              .lineLimit(3)
          }
          .padding(10)
        }
      }
    }
    .frame(maxWidth: .infinity, maxHeight: .infinity)
    .containerBackground(for: .widget) { Color(.systemBackground) }
    .widgetURL(deepLink)
  }

  private var textBlock: some View {
    VStack(alignment: .leading, spacing: 4) {
      Text(entry.category).font(.system(size: 11, weight: .bold)).foregroundStyle(accent)
      Text(entry.title).font(.system(size: 15, weight: .semibold)).foregroundStyle(.primary).lineLimit(3)
      Text("Read on GoodForFree \u{2192}").font(.system(size: 12)).foregroundStyle(.secondary)
    }
  }

  @ViewBuilder
  private func thumbnail(size: CGFloat) -> some View {
    if let img = uiImage {
      Image(uiImage: img).resizable().scaledToFill()
        .frame(width: size, height: size).clipShape(RoundedRectangle(cornerRadius: 12))
    } else {
      RoundedRectangle(cornerRadius: 12).fill(Color(.secondarySystemBackground)).frame(width: size, height: size)
    }
  }

  @ViewBuilder
  private func banner(height: CGFloat) -> some View {
    if let img = uiImage {
      Image(uiImage: img).resizable().scaledToFill()
        .frame(maxWidth: .infinity).frame(height: height).clipped().clipShape(RoundedRectangle(cornerRadius: 14))
    } else {
      RoundedRectangle(cornerRadius: 14).fill(Color(.secondarySystemBackground)).frame(height: height)
    }
  }
}

struct ArticleWidget: Widget {
  let kind = "GoodForFreeArticle"
  var body: some WidgetConfiguration {
    StaticConfiguration(kind: kind, provider: ArticleProvider()) { entry in
      ArticleWidgetView(entry: entry)
    }
    .configurationDisplayName("GoodForFree Article")
    .description("The latest article from GoodForFree.")
    .supportedFamilies([.systemSmall, .systemMedium, .systemLarge])
  }
}

// MARK: - Bundle

@main
struct GoodForFreeWidgets: WidgetBundle {
  var body: some Widget {
    ClockWidget()
    ArticleWidget()
  }
}
