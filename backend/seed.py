from datetime import datetime, timedelta
from app.database import engine, SessionLocal, Base
from app.models.user import User
from app.models.movie import Movie
from app.models.show import Show
from app.models.seat import Seat
from app.models.booking import Booking, BookingSeat
from app.services.auth_service import hash_password
from app.services.booking_service import get_all_cinema_seats
from app.core.datetime_utils import get_utc_now

def seed_database():
    print("Initializing database tables...")
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()

    try:
        # 1. Seed 80 Seats (A1 to H10)
        print("Seeding 80 cinema seats (A1 - H10)...")
        get_all_cinema_seats(db)

        # 2. Seed Users: Admin & Customer
        print("Seeding users...")
        # Yozigo Primary Test Accounts
        admin_yozigo_email = "admin@yozigo.com"
        admin_yozigo = db.query(User).filter(User.email == admin_yozigo_email).first()
        if not admin_yozigo:
            admin_yozigo = User(
                name="Cinema Admin",
                email=admin_yozigo_email,
                hashed_password=hash_password("admin123"),
                role="admin"
            )
            db.add(admin_yozigo)
            print("  Created Admin: admin@yozigo.com / admin123")
        else:
            admin_yozigo.name = "Cinema Admin"
            admin_yozigo.hashed_password = hash_password("admin123")
            admin_yozigo.role = "admin"

        customer_yozigo_email = "customer@yozigo.com"
        customer_yozigo = db.query(User).filter(User.email == customer_yozigo_email).first()
        if not customer_yozigo:
            customer_yozigo = User(
                name="Alex Mercer",
                email=customer_yozigo_email,
                hashed_password=hash_password("customer123"),
                role="customer"
            )
            db.add(customer_yozigo)
            print("  Created Customer: customer@yozigo.com / customer123")
        else:
            customer_yozigo.hashed_password = hash_password("customer123")
            customer_yozigo.role = "customer"

        # Backward compatibility accounts
        admin_email = "admin@cinema.com"
        admin = db.query(User).filter(User.email == admin_email).first()
        if not admin:
            admin = User(
                name="Cinema Admin",
                email=admin_email,
                hashed_password=hash_password("AdminPass123"),
                role="admin"
            )
            db.add(admin)
        else:
            admin.name = "Cinema Admin"
            print("  Created Admin: admin@cinema.com / AdminPass123")

        customer_email = "customer@cinema.com"
        customer = db.query(User).filter(User.email == customer_email).first()
        if not customer:
            customer = User(
                name="Alex Mercer",
                email=customer_email,
                hashed_password=hash_password("CustomerPass123"),
                role="customer"
            )
            db.add(customer)
            print("  Created Customer: customer@cinema.com / CustomerPass123")

        db.commit()

        # 3. Seed Movies: Top 18 All-Time Legendary Movies (Hollywood, Bollywood, Tollywood/South Indian)
        print("Seeding Top 18 all-time critically acclaimed and blockbuster movies...")
        sample_movies = [
            # 1. Hollywood / English (6 Titles)
            {
                "title": "The Dark Knight",
                "description": "When the menace known as the Joker wreaks havoc and chaos on Gotham City, Batman must accept one of the greatest psychological and physical tests of his ability to fight injustice.",
                "poster_url": "/posters/dark_knight.jpg",
                "language": "English",
                "duration_mins": 152,
                "certification": "UA",
                "genre": "Action / Crime / Drama",
                "release_date": "2008-07-18"
            },
            {
                "title": "Interstellar",
                "description": "When Earth becomes uninhabitable in the future, a farmer and ex-NASA pilot, Joseph Cooper, is tasked to pilot a spacecraft, along with a team of researchers, to find a new planet for humans.",
                "poster_url": "/posters/interstellar.jpg",
                "language": "English",
                "duration_mins": 169,
                "certification": "UA",
                "genre": "Sci-Fi / Adventure / Drama",
                "release_date": "2014-11-07"
            },
            {
                "title": "Inception",
                "description": "A thief who steals corporate secrets through the use of dream-sharing technology is given the inverse task of planting an idea into the mind of a C.E.O., but his tragic past may doom the project.",
                "poster_url": "/posters/inception.jpg",
                "language": "English",
                "duration_mins": 148,
                "certification": "UA",
                "genre": "Sci-Fi / Action / Thriller",
                "release_date": "2010-07-16"
            },
            {
                "title": "Oppenheimer",
                "description": "The story of American scientist J. Robert Oppenheimer and his role in the development of the atomic bomb during the Manhattan Project, exploring the moral and political aftermath.",
                "poster_url": "/posters/oppenheimer.jpg",
                "language": "English",
                "duration_mins": 180,
                "certification": "A",
                "genre": "Biography / Drama / History",
                "release_date": "2023-07-21"
            },
            {
                "title": "Avengers: Endgame",
                "description": "After the devastating events of Infinity War, the universe is in ruins. With the help of remaining allies, the Avengers assemble once more in order to reverse Thanos' actions and restore balance.",
                "poster_url": "/posters/avengers_endgame.jpg",
                "language": "English",
                "duration_mins": 181,
                "certification": "UA",
                "genre": "Action / Sci-Fi / Adventure",
                "release_date": "2019-04-26"
            },
            {
                "title": "Gladiator",
                "description": "A former Roman General sets out to exact vengeance against the corrupt emperor who murdered his family and sent him into slavery, rising through the ranks of the Colosseum arena.",
                "poster_url": "/posters/gladiator.jpg",
                "language": "English",
                "duration_mins": 155,
                "certification": "A",
                "genre": "Action / Drama / Adventure",
                "release_date": "2000-05-05"
            },
            # 2. Bollywood / Hindi (6 Titles)
            {
                "title": "3 Idiots",
                "description": "Two friends embark on a quest for a lost buddy. On this journey, they reminisce about their college days and the friend who inspired them to think differently, even as the rest of the world called them 'idiots'.",
                "poster_url": "/posters/3_idiots.jpg",
                "language": "Hindi",
                "duration_mins": 170,
                "certification": "U",
                "genre": "Comedy / Drama",
                "release_date": "2009-12-25"
            },
            {
                "title": "Dangal",
                "description": "Former wrestler Mahavir Singh Phogat and his two wrestler daughters struggle towards glory at the Commonwealth Games in the face of societal oppression and bureaucratic indifference.",
                "poster_url": "/posters/dangal.jpg",
                "language": "Hindi",
                "duration_mins": 161,
                "certification": "U",
                "genre": "Biography / Drama / Sport",
                "release_date": "2016-12-23"
            },
            {
                "title": "Sholay",
                "description": "After his family is murdered by a notorious and ruthless bandit named Gabbar Singh, a former police officer enlists the services of two small-time crooks to bring the dacoit to justice.",
                "poster_url": "/posters/sholay.jpg",
                "language": "Hindi",
                "duration_mins": 162,
                "certification": "U",
                "genre": "Action / Adventure / Classic",
                "release_date": "1975-08-15"
            },
            {
                "title": "Tumbbad",
                "description": "A mythological horror story revolving around a cursed ancient family, a deceitful demon named Hastar, and three generations of insatiable human greed spanning colonial Maharashtra.",
                "poster_url": "/posters/tumbbad.jpg",
                "language": "Hindi",
                "duration_mins": 104,
                "certification": "A",
                "genre": "Fantasy / Horror / Period",
                "release_date": "2018-10-12"
            },
            {
                "title": "Stree 2",
                "description": "The town of Chanderi is being haunted by a headless entity named Sarkata who is abducting progressive women. Vicky and his companions must reunite with the mysterious Stree to defeat the evil spirit.",
                "poster_url": "/posters/stree_2.jpg",
                "language": "Hindi",
                "duration_mins": 147,
                "certification": "UA",
                "genre": "Comedy / Horror",
                "release_date": "2024-08-15"
            },
            {
                "title": "Gangs of Wasseypur",
                "description": "A clash between Sultan and Shahid Khan leads to the expulsion of Khan from Wasseypur, and ignites a deadly multigenerational blood feud over power, revenge, and politics in the coal capital.",
                "poster_url": "/posters/gangs_of_wasseypur.jpg",
                "language": "Hindi",
                "duration_mins": 160,
                "certification": "A",
                "genre": "Action / Crime / Drama",
                "release_date": "2012-06-22"
            },
            # 3. Tollywood & South Indian Cinema (6 Titles)
            {
                "title": "RRR",
                "description": "A fearless revolutionary and an officer in the British force, who are fierce friends unknowingly opposing each other, embark on an epic quest to rescue a captured girl and liberate their motherland.",
                "poster_url": "/posters/rrr.jpg",
                "language": "Telugu",
                "duration_mins": 187,
                "certification": "UA",
                "genre": "Action / Drama / Epic",
                "release_date": "2022-03-25"
            },
            {
                "title": "Baahubali 2: The Conclusion",
                "description": "When Shiva, the son of Bahubali, learns about his heritage, he begins to look for answers. His story is juxtaposed with past events that unfolded in the Mahishmati Kingdom.",
                "poster_url": "/posters/baahubali_2.jpg",
                "language": "Telugu",
                "duration_mins": 167,
                "certification": "UA",
                "genre": "Action / Fantasy / Drama",
                "release_date": "2017-04-28"
            },
            {
                "title": "K.G.F: Chapter 2",
                "description": "The blood-soaked land of Kolar Gold Fields has a new overlord now - Rocky, whose name strikes fear in the heart of his foes. His allies look up to him as their savior, the government sees him as a threat.",
                "poster_url": "/posters/kgf_chapter_2.jpg",
                "language": "Kannada",
                "duration_mins": 168,
                "certification": "UA",
                "genre": "Action / Period / Crime",
                "release_date": "2022-04-14"
            },
            {
                "title": "Kantara",
                "description": "When greed paves the way for betrayal, scheming and murder, a young tribal champion reluctantly dons the mantle of his ancestors to protect his indigenous village and sacred divine forest.",
                "poster_url": "/posters/kantara.jpg",
                "language": "Kannada",
                "duration_mins": 148,
                "certification": "UA",
                "genre": "Action / Thriller / Mystery",
                "release_date": "2022-09-30"
            },
            {
                "title": "Vikram",
                "description": "A high-ranking black-ops squad leader investigates a mysterious covert syndicate of masked killers, unraveling an international narcotics conspiracy connected to his own past.",
                "poster_url": "/posters/vikram.jpg",
                "language": "Tamil",
                "duration_mins": 175,
                "certification": "UA",
                "genre": "Action / Crime / Thriller",
                "release_date": "2022-06-03"
            },
            {
                "title": "Manjummel Boys",
                "description": "A group of friends from a small town in Kerala embark on a vacation trip to Kodaikanal. When one of them falls into the notoriously treacherous Guna Caves, his comrades mount an unprecedented rescue.",
                "poster_url": "/posters/manjummel_boys.jpg",
                "language": "Malayalam",
                "duration_mins": 135,
                "certification": "U",
                "genre": "Survival / Thriller / Adventure",
                "release_date": "2024-02-22"
            }
        ]

        # Prune any legacy placeholder movies to ensure strictly real Indian cinema titles
        valid_titles = [m["title"] for m in sample_movies]
        dummy_movies = db.query(Movie).filter(~Movie.title.in_(valid_titles)).all()
        for dm in dummy_movies:
            for s in dm.shows:
                db.query(BookingSeat).filter(BookingSeat.show_id == s.id).delete(synchronize_session=False)
                db.query(Booking).filter(Booking.show_id == s.id).delete(synchronize_session=False)
            db.query(Show).filter(Show.movie_id == dm.id).delete(synchronize_session=False)
            db.delete(dm)
        db.commit()

        created_movies = []
        for m_data in sample_movies:
            movie = db.query(Movie).filter(Movie.title == m_data["title"]).first()
            if not movie:
                movie = Movie(**m_data)
                db.add(movie)
                db.flush()
                print(f"  Added Movie: {movie.title}")
            created_movies.append(movie)
        db.commit()

        # 4. Seed Shows on Future Dates
        print("Seeding future shows...")
        now = get_utc_now()
        # Create shows for today + 1, today + 2, today + 3, today + 4
        # Each movie gets multiple distinct showtimes across upcoming dates
        daily_time_slots = [
            (10, 0, 220.0),    # 10:00 AM - Morning Show
            (13, 30, 250.0),   # 01:30 PM - Matinee Show
            (17, 45, 290.0),   # 05:45 PM - Evening Show
            (21, 30, 320.0),   # 09:30 PM - Night Show
        ]

        base_date = datetime(now.year, now.month, now.day)
        created_shows = []
        for movie in created_movies:
            for day_offset in range(1, 5):
                for hour, minute, price in daily_time_slots:
                    st = base_date + timedelta(days=day_offset, hours=hour, minutes=minute)
                    et = st + timedelta(minutes=movie.duration_mins)

                    existing_show = db.query(Show).filter(
                        Show.movie_id == movie.id,
                        Show.start_time == st
                    ).first()

                    if not existing_show:
                        show = Show(
                            movie_id=movie.id,
                            screen_name="Screen 1",
                            start_time=st,
                            end_time=et,
                            ticket_price=price
                        )
                        db.add(show)
                        db.flush()
                        created_shows.append(show)
        db.commit()
        print(f"  Seeded {len(created_shows)} upcoming shows across multiple daily time slots.")

        # 5. Seed Pre-Configured Confirmed Bookings for customer@yozigo.com (for Flow 6, 8, 3, and 9 evaluation)
        print("Seeding pre-configured confirmed bookings for customer@yozigo.com...")
        test_bookings_spec = [
            ("The Dark Knight", ["B3", "B4"], "BK-YOZ-DK01"),
            ("3 Idiots", ["A3", "A4"], "BK-YOZ-3I02"),
            ("Interstellar", ["C5", "C6"], "BK-YOZ-IN03"),
        ]

        for movie_title, seat_nums, ref_code in test_bookings_spec:
            target_movie = db.query(Movie).filter(Movie.title == movie_title).first()
            if not target_movie:
                continue

            show = db.query(Show).filter(
                Show.movie_id == target_movie.id,
                Show.start_time > now + timedelta(hours=3)
            ).order_by(Show.start_time).first()

            if not show:
                continue

            existing_b = db.query(Booking).filter(
                (Booking.booking_reference == ref_code) |
                ((Booking.user_id == customer_yozigo.id) & (Booking.show_id == show.id))
            ).first()

            if not existing_b:
                already_booked = db.query(BookingSeat).filter(
                    BookingSeat.show_id == show.id,
                    BookingSeat.seat_number.in_(seat_nums)
                ).first()
                if already_booked:
                    continue

                b = Booking(
                    booking_reference=ref_code,
                    user_id=customer_yozigo.id,
                    show_id=show.id,
                    total_amount=round(show.ticket_price * len(seat_nums), 2),
                    seat_summary=", ".join(seat_nums),
                    status="CONFIRMED",
                    payment_status="SUCCESS",
                    created_at=now
                )
                db.add(b)
                db.flush()

                for sn in seat_nums:
                    db.add(BookingSeat(
                        booking_id=b.id,
                        show_id=show.id,
                        seat_number=sn,
                        created_at=now
                    ))
                db.commit()
                print(f"  Seeded test booking {ref_code} for '{movie_title}' (Seats: {', '.join(seat_nums)}).")

        print("Database seed successfully completed!")

    except Exception as e:
        db.rollback()
        print(f"Error during seed: {e}")
        raise e
    finally:
        db.close()

if __name__ == "__main__":
    seed_database()
