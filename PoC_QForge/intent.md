# QForge Realtime Quiz PoC

## Muc tieu

Xay dung mot PoC app don gian, lay cam hung tu Wayground, de kiem chung tinh nang realtime giua client va server.

## Pham vi

- Client: React.
- Server: Node.js/Express.
- Realtime: Socket.IO.
- Khong su dung database; du lieu quiz duoc mock va luu trong memory.
- UI don gian, de nhin va de thao tac.
- Mot room gom mot host va nhieu player.
- Quiz dung bo question co dinh.
- Moi question co thoi luong mac dinh 10 giay.

## Luong chinh

1. Host tao room.
2. Player join room.
3. Host start quiz.
4. Server dong bo question hien tai cho cac client.
5. Player submit answer.
6. Het 10 giay hoac host chuyen sang next question.
7. Quiz finish.
8. Ket qua chi hien thi sau khi quiz ket thuc.

## Ket qua mong muon

Cac client trong cung room nhan duoc trang thai quiz va question hien tai dong bo theo thoi gian thuc. Server nhan va xu ly answer, chuyen question, ket thuc quiz va tra ve ket qua mock.
