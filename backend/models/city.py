from sqlalchemy import CheckConstraint, Float, ForeignKey, Integer, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from database import Base


class City(Base):
    __tablename__ = "cities"

    __table_args__ = (
        CheckConstraint(
            "cost_index > 0",
            name="ck_city_cost_index_positive",
        ),
        CheckConstraint(
            "popularity >= 0",
            name="ck_city_popularity_non_negative",
        ),
    )

    id: Mapped[int] = mapped_column(
        primary_key=True,
        index=True,
    )

    country_id: Mapped[int] = mapped_column(
        ForeignKey(
            "countries.id",
            ondelete="RESTRICT",
        ),
        nullable=False,
        index=True,
    )

    name: Mapped[str] = mapped_column(
        String(100),
        nullable=False,
        index=True,
    )

    region: Mapped[str | None] = mapped_column(
        String(100),
        nullable=True,
    )

    cost_index: Mapped[float] = mapped_column(
        Float,
        default=1.0,
        nullable=False,
    )

    popularity: Mapped[int] = mapped_column(
        Integer,
        default=0,
        nullable=False,
    )

    image_url: Mapped[str | None] = mapped_column(
        String(500),
        nullable=True,
    )

    country = relationship(
        "Country",
        back_populates="cities",
    )

    activities = relationship(
        "Activity",
        back_populates="city",
        cascade="all, delete-orphan",
    )

    stops = relationship(
        "TripStop",
        back_populates="city",
    )