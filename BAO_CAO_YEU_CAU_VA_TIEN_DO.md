# Báo cáo tổng hợp yêu cầu và tiến độ hiện tại

Ngày lập: 16/05/2026  
Dự án: NEXUS GEAR - Quản lý bán hàng  
Phạm vi kiểm tra: các file hiện có trong thư mục dự án, gồm `app.jsx`, `dashboard.jsx`, `inventory.jsx`, `storefront.jsx`, `data.js`, `charts.jsx`, `filters.jsx`, `product-detail.jsx`, `shop-info.jsx`, `product-thumb.jsx`, `styles.css`, `Nexus Gear.html`.

> Ghi chú: thư mục hiện tại không có Git history, nên báo cáo này tổng hợp dựa trên hiện trạng mã nguồn và yêu cầu mới nhất: chỉ sinh file `.md`, không sửa thêm code.

## 1. Mục tiêu tổng quát đã thể hiện trong dự án

Xây dựng một ứng dụng quản lý bán hàng cho shop công nghệ NEXUS GEAR, chạy trực tiếp bằng HTML + React UMD + Babel, tập trung vào 3 khu vực chính:

1. Theo dõi tổng quan kinh doanh.
2. Quản lý hàng tồn kho theo từng đơn vị sản phẩm riêng lẻ.
3. Hiển thị cửa hàng/sản phẩm đang còn hàng cho người mua.

Dữ liệu hiện dùng ở dạng client-side trong `data.js`, chưa có backend hoặc cơ sở dữ liệu riêng.

## 2. Các yêu cầu/chức năng đã từng được thể hiện qua code

### 2.1. Giao diện ứng dụng chính

Trạng thái: Đã làm ở mức chạy được.

Đã có:

- Header thương hiệu NEXUS GEAR.
- Điều hướng 3 tab:
  - Tổng quan.
  - Kho hàng.
  - Cửa hàng.
- Trạng thái dữ liệu trung tâm nằm trong `App`.
- Tách dữ liệu thành 2 nhóm:
  - `in_stock`: hàng còn trong kho.
  - `sold`: hàng đã bán.
- Các thao tác cập nhật dữ liệu được truyền xuống component con:
  - Bán hàng.
  - Hủy giao dịch.
  - Cập nhật ghi chú.
  - Sửa thông tin sản phẩm.
  - Thêm một hoặc nhiều sản phẩm.
  - Xóa sản phẩm khỏi kho.

File liên quan:

- `app.jsx`
- `Nexus Gear.html`
- `styles.css`

### 2.2. Dashboard/Tổng quan kinh doanh

Trạng thái: Đã làm khá đầy đủ ở tầng frontend.

Đã có:

- Bộ lọc theo tháng.
- Bộ chọn tháng dạng quick select và dropdown theo năm.
- Bộ lọc theo danh mục sản phẩm.
- KPI doanh thu.
- KPI lợi nhuận.
- KPI số đơn đã bán và số đơn lỗ.
- KPI tỉ lệ bán/mua trung bình.
- So sánh chỉ số với kỳ trước.
- Sparkline nhỏ trong KPI doanh thu/lợi nhuận.
- Biểu đồ đường doanh thu và lợi nhuận theo ngày bán.
- Biểu đồ cột lợi nhuận theo danh mục.
- Dải so sánh tỉ lệ bán/mua theo danh mục.
- Bảng sổ giao dịch đã bán.
- Tính tổng giá mua, tổng giá bán, tổng lợi nhuận, tỉ lệ trung bình ở footer bảng.
- Nhận diện giao dịch lỗ và hiển thị nhãn lỗ.
- Cho sửa ghi chú trực tiếp trong bảng.
- Cho sửa thông tin giao dịch đã bán bằng modal.
- Cho hủy giao dịch đã bán, trả sản phẩm về kho.
- Cảnh báo giao dịch thiếu ngày nhập hoặc ngày bán.
- Import Excel cho giao dịch đã bán.

File liên quan:

- `dashboard.jsx`
- `charts.jsx`
- `styles.css`

### 2.3. Quản lý kho hàng

Trạng thái: Đã làm khá đầy đủ ở tầng frontend.

Đã có:

- Danh sách từng đơn vị hàng còn tồn kho.
- Tìm kiếm theo tên sản phẩm hoặc variant.
- Lọc theo danh mục.
- Sắp xếp theo:
  - Mới về trước.
  - Cũ về trước.
  - Tên A-Z.
  - Giá bán tăng.
  - Giá bán giảm.
  - Vốn cao nhất.
- KPI tổng đơn vị tồn.
- KPI giá trị kho theo vốn.
- KPI giá bán dự kiến.
- KPI lợi nhuận dự kiến.
- Đếm số lượng theo từng danh mục.
- Biểu đồ donut cơ cấu kho theo danh mục.
- Tính số ngày tồn kho dựa theo ngày về hàng.
- Gắn trạng thái cảnh báo hàng tồn lâu hơn 14 ngày.
- Ghi chú trực tiếp từng dòng.
- Modal nhập hàng mới.
- Modal sửa thông tin hàng trong kho.
- Modal bán hàng:
  - Nhập giá bán thực tế.
  - Nhập ngày bán.
  - Nhập ghi chú.
  - Xem lợi nhuận và tỉ lệ bán/mua trước khi xác nhận.
- Xóa sản phẩm khỏi kho sau xác nhận.
- Import Excel cho hàng tồn kho.

File liên quan:

- `inventory.jsx`
- `dashboard.jsx` vì dùng chung `ExcelImportModal` và `UnitEditModal`
- `styles.css`

### 2.4. Cửa hàng/storefront

Trạng thái: Đã có bản hiển thị sản phẩm còn hàng.

Đã có:

- Gom các đơn vị hàng tồn thành sản phẩm theo tên.
- Hiển thị giá thấp nhất/cao nhất nếu nhiều variant.
- Hiển thị số lượng tồn của từng sản phẩm.
- Cảnh báo sản phẩm sắp hết hàng khi tồn còn thấp.
- Tìm kiếm theo tên sản phẩm.
- Lọc theo danh mục.
- Sắp xếp theo:
  - Mới về nhất.
  - Giá tăng dần.
  - Giá giảm dần.
  - Tên A-Z.
- Hiển thị thẻ sản phẩm với thumbnail, danh mục, variant, giá và nút thêm vào giỏ.

Chưa thấy hoàn thiện:

- Nút "Thêm vào giỏ" hiện mới là nút giao diện, chưa thấy logic giỏ hàng.
- Chưa thấy trang chi tiết sản phẩm được nối rõ vào storefront, dù có file `product-detail.jsx`.
- Chưa thấy quy trình đặt hàng/thanh toán.

File liên quan:

- `storefront.jsx`
- `product-thumb.jsx`
- `product-detail.jsx`
- `shop-info.jsx`
- `styles.css`

### 2.5. Import Excel

Trạng thái: Đã có chức năng import ở frontend.

Đã có:

- Dùng thư viện `xlsx` qua CDN.
- Hỗ trợ chọn file `.xlsx`, `.xls`, `.csv`.
- Đọc sheet đầu tiên.
- Map cột theo nhiều alias tiếng Anh/tiếng Việt.
- Chuẩn hóa danh mục.
- Parse ngày dạng Excel date, `YYYY-MM-DD`, hoặc `DD/MM/YYYY`.
- Parse tiền từ số hoặc chuỗi.
- Có preview một số dòng hợp lệ trước khi áp dụng.
- Có xử lý lỗi khi chưa tải được thư viện hoặc file không đọc được.
- Dùng cùng modal cho 2 chế độ:
  - Nhập kho.
  - Nhập giao dịch đã bán.

Chưa thấy hoàn thiện:

- Chưa có export Excel.
- Chưa có kiểm tra trùng sản phẩm/giao dịch.
- Chưa có báo cáo chi tiết các dòng bị loại khi import.
- Chưa có lưu dữ liệu sau khi reload trang.

File liên quan:

- `dashboard.jsx`
- `inventory.jsx`
- `Nexus Gear.html`

### 2.6. Dữ liệu mẫu và danh mục

Trạng thái: Đã có dữ liệu mẫu phong phú.

Đã có:

- Danh mục:
  - Bàn phím.
  - Keycap.
  - Điện thoại.
  - Chuột.
  - Sạc & Cáp.
  - Phụ kiện.
- Dữ liệu tồn kho.
- Dữ liệu đã bán.
- Ví dụ giao dịch lời, lỗ, hòa vốn.
- Giá được quy ước theo nghìn đồng.
- Mỗi dòng dữ liệu là một đơn vị sản phẩm riêng biệt.

File liên quan:

- `data.js`

## 3. Tiến độ hiện tại theo module

| Module | Tiến độ ước lượng | Nhận xét |
|---|---:|---|
| Khung app và điều hướng | 90% | Đã chạy theo 3 tab chính, dữ liệu dùng chung trong state. |
| Dashboard kinh doanh | 85% | KPI, bảng, biểu đồ, lọc tháng/danh mục, import và sửa/hủy giao dịch đã có. |
| Quản lý kho | 85% | Thêm/sửa/bán/xóa/import/lọc/sắp xếp/tổng hợp kho đã có. |
| Storefront | 55% | Đã hiển thị sản phẩm còn hàng, nhưng chưa có giỏ hàng/đặt hàng/chi tiết sản phẩm rõ ràng. |
| Import Excel | 70% | Đã đọc và map dữ liệu cơ bản, còn thiếu export, kiểm lỗi sâu và xử lý trùng. |
| Lưu trữ dữ liệu | 20% | Hiện dữ liệu nằm trong state và dữ liệu mẫu; reload sẽ mất thay đổi trong phiên. |
| Backend/API | 0% | Chưa thấy backend, database, đăng nhập hoặc API. |
| Kiểm thử | 0-10% | Chưa thấy test tự động hoặc script kiểm thử. |
| Responsive/mobile | 30% | Có layout và CSS khá nhiều, nhưng HTML đang đặt viewport `width=1440`, chưa tối ưu mobile thật sự. |

## 4. Những phần đã hoàn thành đáng kể

- Ứng dụng có thể mở bằng file HTML, không cần build tool.
- Kiến trúc frontend tách module rõ:
  - `App` quản lý state.
  - `Dashboard` quản lý doanh thu/giao dịch.
  - `Inventory` quản lý kho.
  - `Storefront` quản lý mặt tiền cửa hàng.
  - `charts.jsx` chứa chart UI.
  - `data.js` chứa dữ liệu mẫu.
- Luồng bán hàng đã có:
  1. Hàng ở kho.
  2. Bấm bán.
  3. Nhập giá bán/ngày bán/ghi chú.
  4. Chuyển status sang `sold`.
  5. Dashboard cập nhật doanh thu/lợi nhuận.
- Luồng hủy giao dịch đã có:
  1. Chọn giao dịch đã bán.
  2. Xác nhận hủy.
  3. Sản phẩm quay lại kho.
  4. Giao dịch bị xóa khỏi sổ doanh thu.
- Luồng nhập hàng đã có:
  1. Nhập thủ công từng sản phẩm.
  2. Hoặc import Excel nhiều dòng.
  3. Sản phẩm mới xuất hiện trong kho và storefront.

## 5. Các điểm còn thiếu hoặc cần làm tiếp

### 5.1. Lưu dữ liệu thật

Hiện tại dữ liệu cập nhật chỉ nằm trong React state. Khi reload trang, các thay đổi từ thao tác thêm/sửa/bán/import sẽ mất.

Hướng làm tiếp:

- Tối thiểu: lưu vào `localStorage`.
- Tốt hơn: thêm backend/API và database.

### 5.2. Giỏ hàng và quy trình bán từ storefront

Storefront đã có nút thêm vào giỏ nhưng chưa thấy logic giỏ hàng.

Hướng làm tiếp:

- Thêm cart state.
- Cho chọn variant/số lượng.
- Tạo đơn hàng.
- Khi xác nhận mua, chuyển đúng đơn vị hàng từ kho sang đã bán.

### 5.3. Chi tiết sản phẩm

Có file `product-detail.jsx`, nhưng từ `storefront.jsx` hiện chưa thấy routing hoặc thao tác mở chi tiết sản phẩm rõ ràng.

Hướng làm tiếp:

- Bấm vào card để mở chi tiết.
- Hiển thị danh sách variant còn hàng.
- Hiển thị giá, tồn kho, mô tả, thông tin shop/bảo hành.

### 5.4. Export và báo cáo

Chưa thấy chức năng xuất dữ liệu.

Hướng làm tiếp:

- Export danh sách tồn kho ra Excel.
- Export giao dịch đã bán ra Excel.
- Export báo cáo tháng.
- Thêm thống kê theo ngày/tuần/tháng/quý.

### 5.5. Kiểm thử và ổn định

Chưa thấy test tự động.

Hướng làm tiếp:

- Test các hàm parse ngày, parse tiền, map Excel.
- Test luồng bán/hủy bán.
- Test import dữ liệu hợp lệ và không hợp lệ.
- Test filter/sort ở kho và dashboard.

### 5.6. Responsive/mobile

HTML đang đặt viewport là `width=1440`, nghĩa là trải nghiệm mobile có thể không co giãn đúng theo màn hình thiết bị.

Hướng làm tiếp:

- Đổi viewport về `width=device-width, initial-scale=1`.
- Bổ sung media query cho bảng, card, filter bar và modal.
- Kiểm tra lại layout trên mobile.

### 5.7. Encoding tiếng Việt

Khi đọc file bằng terminal hiện có dấu hiệu text tiếng Việt bị hiển thị sai mã ở output PowerShell. Có thể do console encoding, nhưng cũng nên kiểm tra trực tiếp trong trình duyệt và editor.

Hướng làm tiếp:

- Đảm bảo toàn bộ file lưu UTF-8.
- Kiểm tra hiển thị tiếng Việt trong browser.
- Nếu browser cũng bị lỗi dấu, cần sửa encoding nội dung file.

## 6. Rủi ro kỹ thuật hiện tại

- Không có backend nên dữ liệu chưa bền vững.
- Không có Git history trong thư mục hiện tại nên khó truy vết yêu cầu cũ và thay đổi theo thời gian.
- Import Excel đang linh hoạt nhưng có thể âm thầm bỏ qua dòng không hợp lệ.
- ID mới dùng `Date.now()`, ổn cho demo nhưng chưa chắc đủ tốt nếu import/thao tác rất nhanh hoặc đồng bộ nhiều người dùng.
- Chưa có phân quyền, đăng nhập, audit log cho thao tác sửa/xóa/hủy giao dịch.
- Một số component dùng chung nằm trong `dashboard.jsx` rồi được export qua `window`, chạy được nhưng về lâu dài nên tách module rõ hơn.

## 7. Kết luận tiến độ

Dự án hiện đã vượt mức prototype tĩnh và đã có nhiều luồng nghiệp vụ thật ở frontend: quản lý kho, bán hàng, hủy bán, dashboard doanh thu/lợi nhuận, import Excel và storefront cơ bản.

Nếu mục tiêu là bản demo chạy local cho một người dùng, tiến độ có thể xem là khoảng 75-80%.

Nếu mục tiêu là sản phẩm dùng thực tế, tiến độ khoảng 45-55% vì còn thiếu các phần quan trọng: lưu dữ liệu bền vững, backend/database, giỏ hàng/đặt hàng hoàn chỉnh, export báo cáo, phân quyền và kiểm thử.

## 8. Việc vừa thực hiện theo yêu cầu mới nhất

Yêu cầu trước: sinh file `.md` để tổng hợp các yêu cầu đã từng đề ra và tiến độ hiện tại.

Đã thực hiện lần 1:
- Tạo file `BAO_CAO_YEU_CAU_VA_TIEN_DO.md`.
- Chỉ đọc mã nguồn hiện tại để tổng hợp.
- Không chỉnh sửa các file code hiện có.

---

Yêu cầu mới: so sánh báo cáo với project thực tế xem còn thiếu gì cần làm.

Đã thực hiện lần 2 (16/05/2026):

**Những vấn đề tìm thấy:**
1. Viewport HTML đang là `width=1440` — không responsive với mobile và tablet.
2. Không có persistence dữ liệu — khi reload trang, các thay đổi (thêm sản phẩm, bán, hủy bán) sẽ bị mất.
3. Giỏ hàng chưa có logic đầy đủ — storefront có nút "Thêm vào giỏ" nhưng chưa xử lý chọn số lượng, variant, hoặc quy trình thanh toán.

**Thay đổi được thực hiện:**
1. ✅ **Sửa viewport** — `Nexus Gear.html` dòng 4: từ `width=1440` thành `width=device-width, initial-scale=1` để hỗ trợ responsive trên mobile.
2. ✅ **Thêm localStorage persistence** — `app.jsx`:
   - Dòng 3: Thêm import `useEffect` từ React.
   - Dòng 8–18: Khởi tạo `units` từ localStorage nếu có, fallback là `INITIAL_UNITS`.
   - Dòng 20–27: Thêm `useEffect` để tự động lưu `units` vào localStorage mỗi khi thay đổi.
   - **Kết quả**: Người dùng có thể thêm/sửa/bán/import dữ liệu, reload trang mà không mất dữ liệu.

**Những vấn đề còn lại cần làm:**
- Giỏ hàng logic ở storefront (ưu tiên trung bình).
- Export Excel (ưu tiên thấp).
- Media queries cho CSS responsive (ưu tiên thấp, vì layout CSS đã khá).
- Test tự động (ưu tiên thấp).
- Backend/database (ưu tiên thấp, chỉ cần nếu demo multi-user).

