# images フォルダ

このフォルダに、研修用のスクリーンショット画像を配置してください。

index.html 内の各 `.screenshot-placeholder` の `ss-file` に記載されているファイル名(例: `classroom-join.png`)と同じ名前で保存すると分かりやすいです。

## 差し替え手順

1. スクリーンショットをこのフォルダに保存する(例: `images/classroom-join.png`)
2. index.html 内の該当する `.screenshot-placeholder` を探す
3. `<div class="screenshot-placeholder" ...>` の中に、次の1行を追加する

```html
<img src="images/classroom-join.png" alt="クラスコード入力画面">
```

4. 保存すれば反映されます。クリック時の拡大モーダルにも自動的に同じ画像が表示されます。

## 使用予定のファイル一覧

- classroom-overview.png(Classroomとは)
- classroom-join.png(参加方法)
- classroom-stream.png(ストリーム)
- classroom-classwork.png(授業)
- classroom-people.png(メンバー)
- meet-overview.png(Meetとは)
- meet-join.png(Meet参加)
- meet-mic.png(マイク)
- meet-camera.png(カメラ)
- meet-chat.png(チャット)
- meet-raise-hand.png(挙手)
- meet-leave.png(退出)
- hybrid-setup.png(教室の配置イメージ)
