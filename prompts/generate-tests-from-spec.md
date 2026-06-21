# Prompt — Sinh automation test từ spec (test-from-spec)

> Mở Claude Code tại repo `TripOTA.Reconciliation.AutoTest/`. Dán prompt. Claude đọc spec từ
> `../doisoat-spec/specs/001-doisoat-1b/spec.md` + KB, rồi sinh test theo khung sẵn có.

```
Bối cảnh: repo automation test cho Đối Soát 1B, stack TypeScript + Vitest (+ k6).
Nguyên tắc: TEST SINH TỪ SPEC, không từ code. Mỗi test trace về US-1B-0x và spec clause.

Hãy:
1) Đọc:
   - ../TripOTA.Reconciliation.Spec/CLAUDE.md (cách làm việc)
   - ../TripOTA.Reconciliation.Spec/specs/001-doisoat-1b/spec.md (user stories + acceptance criteria)
   - ../TripOTA.Reconciliation.Spec/knowledge-base/graphify-out/GRAPH_REPORT.md (kiến trúc)
   - lib/ (api-client, assertions, fixtures) và 1 test mẫu trong tests/vital/ + tests/regression/
2) Với mỗi US chưa có test (xem docs/traceability.md, cột ⬜):
   - Sinh test Vitest theo đúng style file mẫu, đặt vào tests/vital/api hoặc tests/regression/api.
   - Phủ happy path + edge: thiếu dữ liệu, duplicate, NDC vs non-NDC, refund, vé nối.
   - Dùng loadSample(...) cho dữ liệu; thêm sample mới vào lib/sample-data nếu cần.
   - Tên describe: [VITAL]/[REGRESSION] + US-1B-0x; comment đầu file ghi spec clause.
3) Cập nhật docs/traceability.md (đánh dấu test đã tạo).
4) KHÔNG sửa source code ứng dụng. Endpoint chưa rõ → để TODO + hỏi tôi, đừng bịa.
5) Liệt kê test đã sinh + US tương ứng để tôi review.
```
